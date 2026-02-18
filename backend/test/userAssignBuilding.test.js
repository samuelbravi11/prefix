// test/userAssignBuilding.test.js

const { default: request }    = await import('supertest');
const { default: mongoose }   = await import('mongoose');
const { MongoMemoryServer }   = await import('mongodb-memory-server');
const { default: app }        = await import('../src/app.js');
const { default: User }       = await import('../src/models/User.js');
const { default: Building }   = await import('../src/models/Building.js');

let mongoServer;
let activeUser;
let targetUser;
let testBuilding1;
let testBuilding2;

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    // Seeding edifici da assegnare nei test
    testBuilding1 = await Building.create({
        name: 'Edificio A',
        address: 'Via Roma 1',
        city: 'Milano',
        isActive: true
    });

    testBuilding2 = await Building.create({
        name: 'Edificio B',
        address: 'Via Verdi 2',
        city: 'Roma',
        isActive: true
    });
});

beforeEach(async () => {
    activeUser = await User.create({
        name: 'Admin',
        surname: 'Test',
        email: 'admin@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-admin-123',
        roles: [],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });

    targetUser = await User.create({
        name: 'Target',
        surname: 'User',
        email: 'target@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-target-456',
        roles: [],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });
});

afterEach(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
    await Building.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
});

// ─── HELPER ──────────────────────────────────────────────────────────────────

const asUser = (method, path, userId) => {
    return request(app)[method](path)
        .set('x-internal-proxy', 'true')
        .set('x-user-id', userId.toString())
        .set('Accept', 'application/json');
};

// ─── TEST ─────────────────────────────────────────────────────────────────────

describe('User Assignment: Assign Building', () => {

    it('Deve assegnare un singolo edificio a un utente esistente', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({ buildingIds: [testBuilding1._id] });

        expect(res.statusCode).toEqual(200);

        // Verifica diretta sul DB
        const updated = await User.findById(targetUser._id);
        expect(updated.buildingIds.map(b => b.toString()))
            .toContain(testBuilding1._id.toString());
    });

    it('Deve assegnare più edifici contemporaneamente', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({ buildingIds: [testBuilding1._id, testBuilding2._id] });

        expect(res.statusCode).toEqual(200);

        const updated = await User.findById(targetUser._id);
        const ids = updated.buildingIds.map(b => b.toString());
        expect(ids).toContain(testBuilding1._id.toString());
        expect(ids).toContain(testBuilding2._id.toString());
        expect(ids).toHaveLength(2);
    });

    it('Deve assegnare un array vuoto (rimuove tutti gli edifici)', async () => {
        // Prima assegniamo un edificio
        await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({ buildingIds: [testBuilding1._id] });

        // Poi lo svuotiamo
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({ buildingIds: [] });

        expect(res.statusCode).toEqual(200);

        const updated = await User.findById(targetUser._id);
        expect(updated.buildingIds).toHaveLength(0);
    });

    it('Deve restituire 400 se buildingIds non è un array', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({ buildingIds: 'non-un-array' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('buildingIds deve essere un array di ObjectId');
    });

    it('Deve restituire 400 se buildingIds è assente nel body', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, activeUser._id)
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('buildingIds deve essere un array di ObjectId');
    });

    it('Deve restituire 404 se l\'utente target non esiste', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await asUser('put', `/api/v1/users/${fakeId}/assign-building`, activeUser._id)
            .send({ buildingIds: [testBuilding1._id] });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe('Utente non trovato');
    });

    it('Deve restituire 403 se chi fa la richiesta è un utente pending', async () => {
        const pendingUser = await User.create({
            name: 'Pending',
            surname: 'User',
            email: 'pending@prefix.it',
            status: 'pending',
            fingerprintHash: 'fp-pending-789',
            roles: [],
            buildingIds: [],
            auth: { passwordHash: 'hash-placeholder' }
        });

        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-building`, pendingUser._id)
            .send({ buildingIds: [testBuilding1._id] });

        expect(res.statusCode).toEqual(403);
    });
});