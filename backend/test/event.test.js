// test/event.test.js

const { default: request }    = await import('supertest');
const { default: mongoose }   = await import('mongoose');
const { MongoMemoryServer }   = await import('mongodb-memory-server');
const { default: app }        = await import('../src/app.js');
const { default: User }       = await import('../src/models/User.js');
const { default: Building }   = await import('../src/models/Building.js');
const { default: Event }      = await import('../src/models/Event.js');

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
    await Event.deleteMany({});
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

describe('Events Workflow', () => {

    describe('GET /api/v1/events', () => {

        it('Deve restituire gli eventi degli edifici dell\'utente', async () => {
            await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'rule_based',
                status: 'pending'
            });

            const res = await asUser('get', '/api/v1/events', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);
        });

        it('Deve restituire array vuoto se non ci sono eventi', async () => {
            const res = await asUser('get', '/api/v1/events', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(0);
        });

        it('Deve restituire 403 se si richiedono edifici non associati all\'utente', async () => {
            const res = await asUser('get', `/api/v1/events?buildingIds=${otherBuilding._id}`, activeUser._id);

            expect(res.statusCode).toEqual(403);
        });

        it('Deve filtrare solo eventi schedulati con view=calendar', async () => {
            await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'rule_based',
                status: 'pending',
                scheduledAt: null
            });

            await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'rule_based',
                status: 'scheduled',
                scheduledAt: new Date(Date.now() + 86400000) // domani
            });

            const res = await asUser('get', '/api/v1/events?view=calendar', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].status).toBe('scheduled');
        });

        it('Deve filtrare solo eventi futuri con view=future', async () => {
            await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'rule_based',
                status: 'completed',
                scheduledAt: new Date(Date.now() - 86400000) // ieri
            });

            await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'rule_based',
                status: 'scheduled',
                scheduledAt: new Date(Date.now() + 86400000) // domani
            });

            const res = await asUser('get', '/api/v1/events?view=future', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].status).toBe('scheduled');
        });
    });

    describe('GET /api/v1/events/:id', () => {

        it('Deve restituire il dettaglio di un evento esistente', async () => {
            const event = await Event.create({
                assetId: testAssetId,
                buildingId: testBuilding._id,
                reason: 'ai_predictive',
                status: 'pending'
            });

            const res = await asUser('get', `/api/v1/events/${event._id}`, activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body._id).toBe(event._id.toString());
            expect(res.body.reason).toBe('ai_predictive');
        });

        it('Deve restituire 404 se l\'evento non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await asUser('get', `/api/v1/events/${fakeId}`, activeUser._id);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Evento non trovato');
        });

        it('Deve restituire 404 se l\'evento appartiene a un edificio non autorizzato', async () => {
            const event = await Event.create({
                assetId: testAssetId,
                buildingId: otherBuilding._id,
                reason: 'rule_based',
                status: 'pending'
            });

            const res = await asUser('get', `/api/v1/events/${event._id}`, activeUser._id);

            expect(res.statusCode).toEqual(404);
        });
    });
});