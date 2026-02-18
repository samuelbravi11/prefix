// test/intervention.test.js

const { default: request }      = await import('supertest');
const { default: mongoose }     = await import('mongoose');
const { MongoMemoryServer }     = await import('mongodb-memory-server');
const { default: app }          = await import('../src/app.js');
const { default: User }         = await import('../src/models/User.js');
const { default: Building }     = await import('../src/models/Building.js');
const { Intervention }          = await import('../src/models/Intervention.js');

let mongoServer;
let activeUser;
let testBuilding;
let otherBuilding;
let testAssetId;

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    testAssetId = new mongoose.Types.ObjectId();

    testBuilding = await Building.create({
        name: 'Edificio Test',
        address: 'Via Test 1',
        city: 'Milano',
        isActive: true
    });

    otherBuilding = await Building.create({
        name: 'Edificio Altri',
        address: 'Via Altri 2',
        city: 'Roma',
        isActive: true
    });
});

beforeEach(async () => {
    activeUser = await User.create({
        name: 'Test',
        surname: 'User',
        email: 'test@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-test-123',
        roles: [],
        buildingIds: [testBuilding._id],
        auth: { passwordHash: 'hash-placeholder' }
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Intervention.deleteMany({});
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

describe('Interventions Workflow', () => {

    describe('GET /api/v1/interventions', () => {

        it('Deve restituire gli interventi degli edifici dell\'utente', async () => {
            await Intervention.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                type: 'maintenance',
                performedAt: new Date()
            });

            const res = await asUser('get', '/api/v1/interventions', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);
        });

        it('Deve restituire array vuoto se non ci sono interventi', async () => {
            const res = await asUser('get', '/api/v1/interventions', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(0);
        });

        it('Deve restituire 403 se si richiedono edifici non associati all\'utente', async () => {
            const res = await asUser('get', `/api/v1/interventions?buildingIds=${otherBuilding._id}`, activeUser._id);

            expect(res.statusCode).toEqual(403);
        });

        it('Deve restituire 400 se period non è valido', async () => {
            const res = await asUser('get', '/api/v1/interventions?period=invalid', activeUser._id);

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Parametro period non valido');
        });

        it('Deve filtrare per period=month senza errori', async () => {
            await Intervention.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                type: 'inspection',
                performedAt: new Date()
            });

            const res = await asUser('get', '/api/v1/interventions?period=month', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
        });
    });

    describe('GET /api/v1/interventions/:id', () => {

        it('Deve restituire il dettaglio di un intervento esistente', async () => {
            const intervention = await Intervention.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                type: 'repair',
                performedAt: new Date()
            });

            const res = await asUser('get', `/api/v1/interventions/${intervention._id}`, activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body._id).toBe(intervention._id.toString());
            expect(res.body.type).toBe('repair');
        });

        it('Deve restituire 404 se l\'intervento non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await asUser('get', `/api/v1/interventions/${fakeId}`, activeUser._id);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Intervento non trovato');
        });

        it('Deve restituire 404 se l\'intervento appartiene a un edificio non autorizzato', async () => {
            const intervention = await Intervention.create({
                assetId: testAssetId,
                buildingId: otherBuilding._id,
                type: 'maintenance',
                performedAt: new Date()
            });

            const res = await asUser('get', `/api/v1/interventions/${intervention._id}`, activeUser._id);

            expect(res.statusCode).toEqual(404);
        });
    });
});