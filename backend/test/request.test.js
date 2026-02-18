// test/request.test.js

const { default: request }    = await import('supertest');
const { default: mongoose }   = await import('mongoose');
const { MongoMemoryServer }   = await import('mongodb-memory-server');
const { default: app }        = await import('../src/app.js');
const { default: User }       = await import('../src/models/User.js');
const { default: Building }   = await import('../src/models/Building.js');
const { default: Request }    = await import('../src/models/Request.js');

let mongoServer;
let adminUser;
let targetUser;
let testBuilding;

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    // Seeding edificio riutilizzato nei test
    testBuilding = await Building.create({
        name: 'Edificio Test',
        address: 'Via Test 1',
        city: 'Milano',
        isActive: true
    });
});

beforeEach(async () => {
    adminUser = await User.create({
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
    await Request.deleteMany({});
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

describe('Requests Workflow', () => {

    describe('POST /api/v1/requests/assign-role', () => {

        it('Deve creare una richiesta di assegnazione ruolo con status PENDING', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-role', adminUser._id)
                .send({ userId: targetUser._id, role: 'technician' });

            expect(res.statusCode).toEqual(201);
            expect(res.body.requestType).toBe('ASSIGN_ROLE');
            expect(res.body.status).toBe('PENDING');
            expect(res.body.payload.role).toBe('technician');
            expect(res.body.createdBy).toBe(adminUser._id.toString());
        });

        it('Deve restituire 400 se userId è mancante', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-role', adminUser._id)
                .send({ role: 'technician' });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('userId e role sono obbligatori');
        });

        it('Deve restituire 400 se role è mancante', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-role', adminUser._id)
                .send({ userId: targetUser._id });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('userId e role sono obbligatori');
        });
    });

    describe('POST /api/v1/requests/assign-building', () => {

        it('Deve creare una richiesta di assegnazione edificio con status PENDING', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-building', adminUser._id)
                .send({ userId: targetUser._id, buildingId: testBuilding._id });

            expect(res.statusCode).toEqual(201);
            expect(res.body.requestType).toBe('ASSIGN_BUILDING');
            expect(res.body.status).toBe('PENDING');
            expect(res.body.payload.buildingId).toBe(testBuilding._id.toString());
            expect(res.body.createdBy).toBe(adminUser._id.toString());
        });

        it('Deve restituire 400 se userId è mancante', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-building', adminUser._id)
                .send({ buildingId: testBuilding._id });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('userId e buildingId sono obbligatori');
        });

        it('Deve restituire 400 se buildingId è mancante', async () => {
            const res = await asUser('post', '/api/v1/requests/assign-building', adminUser._id)
                .send({ userId: targetUser._id });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('userId e buildingId sono obbligatori');
        });
    });

    describe('GET /api/v1/requests', () => {

        it('Deve restituire la lista di tutte le richieste', async () => {
            // Creiamo due richieste
            await Request.create({
                requestType: 'ASSIGN_ROLE',
                userId: targetUser._id,
                payload: { role: 'technician' },
                createdBy: adminUser._id
            });

            await Request.create({
                requestType: 'ASSIGN_BUILDING',
                userId: targetUser._id,
                payload: { buildingId: testBuilding._id },
                createdBy: adminUser._id
            });

            const res = await asUser('get', '/api/v1/requests', adminUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(2);
        });

        it('Deve restituire array vuoto se non ci sono richieste', async () => {
            const res = await asUser('get', '/api/v1/requests', adminUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(0);
        });
    });

    describe('GET /api/v1/requests/:id', () => {

        it('Deve restituire il dettaglio di una richiesta esistente', async () => {
            const created = await Request.create({
                requestType: 'ASSIGN_ROLE',
                userId: targetUser._id,
                payload: { role: 'technician' },
                createdBy: adminUser._id
            });

            const res = await asUser('get', `/api/v1/requests/${created._id}`, adminUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body._id).toBe(created._id.toString());
            expect(res.body.requestType).toBe('ASSIGN_ROLE');
        });

        it('Deve restituire 404 se la richiesta non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await asUser('get', `/api/v1/requests/${fakeId}`, adminUser._id);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Richiesta non trovata');
        });
    });

    describe('PUT /api/v1/requests/:id', () => {

        it('Deve approvare una richiesta PENDING', async () => {
            const created = await Request.create({
                requestType: 'ASSIGN_ROLE',
                userId: targetUser._id,
                payload: { role: 'technician' },
                createdBy: adminUser._id
            });

            const res = await asUser('put', `/api/v1/requests/${created._id}`, adminUser._id)
                .send({ status: 'APPROVED' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('APPROVED');
            expect(res.body.decidedBy).toBe(adminUser._id.toString());
            expect(res.body.decidedAt).toBeDefined();
        });

        it('Deve rifiutare una richiesta PENDING', async () => {
            const created = await Request.create({
                requestType: 'ASSIGN_ROLE',
                userId: targetUser._id,
                payload: { role: 'technician' },
                createdBy: adminUser._id
            });

            const res = await asUser('put', `/api/v1/requests/${created._id}`, adminUser._id)
                .send({ status: 'REJECTED' });

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('REJECTED');
            expect(res.body.decidedBy).toBe(adminUser._id.toString());
        });

        it('Deve restituire 400 se lo status non è valido', async () => {
            const created = await Request.create({
                requestType: 'ASSIGN_ROLE',
                userId: targetUser._id,
                payload: { role: 'technician' },
                createdBy: adminUser._id
            });

            const res = await asUser('put', `/api/v1/requests/${created._id}`, adminUser._id)
                .send({ status: 'INVALID_STATUS' });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Status non valido');
        });

        it('Deve restituire 404 se la richiesta non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await asUser('put', `/api/v1/requests/${fakeId}`, adminUser._id)
                .send({ status: 'APPROVED' });

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Richiesta non trovata');
        });
    });
});