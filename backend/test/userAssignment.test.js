// test/userAssignment.test.js

const { default: request }        = await import('supertest');
const { default: mongoose }       = await import('mongoose');
const { MongoMemoryServer }       = await import('mongodb-memory-server');
const { default: app }            = await import('../src/app.js');
const { default: User }           = await import('../src/models/User.js');
const { default: Role }           = await import('../src/models/Role.js');

let mongoServer;
let activeUser;   // utente attivo che fa le richieste (simula l'admin)
let targetUser;   // utente su cui vengono fatte le assegnazioni
let testRole;     // ruolo da assegnare

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    // Seeding ruolo da assegnare nei test
    testRole = await Role.findOneAndUpdate(
        { roleName: 'utente_secondario' },
        { roleName: 'utente_secondario' },
        { upsert: true, new: true }
    );
});

beforeEach(async () => {
    // Admin che esegue le operazioni (deve essere active per passare requireActiveUser)
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

    // Utente target delle assegnazioni
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

describe('User Assignment: Assign Role', () => {

    it('Deve assegnare un ruolo a un utente esistente', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-role`, activeUser._id)
            .send({ roleId: testRole._id });

        expect(res.statusCode).toEqual(200);

        // Verifica che il ruolo sia stato effettivamente salvato nel DB
        const updated = await User.findById(targetUser._id);
        expect(updated.roles.map(r => r.toString())).toContain(testRole._id.toString());
    });

    it('Deve restituire 400 se roleId è mancante nel body', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-role`, activeUser._id)
            .send({});  // body vuoto

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe("Campo 'roleId' mancante");
    });

    it('Deve restituire 404 se l\'utente target non esiste', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await asUser('put', `/api/v1/users/${fakeId}/assign-role`, activeUser._id)
            .send({ roleId: testRole._id });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toBe("Utente non trovato");
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

        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-role`, pendingUser._id)
            .send({ roleId: testRole._id });

        expect(res.statusCode).toEqual(403);
    });

    it('Deve restituire 500 se roleId non è un ObjectId valido', async () => {
        const res = await asUser('put', `/api/v1/users/${targetUser._id}/assign-role`, activeUser._id)
            .send({ roleId: 'id-non-valido' });

        expect(res.statusCode).toEqual(500);
    });
});