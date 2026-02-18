// test/user.test.js

// IMPORT DINAMICI (ESM)
const { default: request }        = await import('supertest');
const { default: mongoose }       = await import('mongoose');
const { MongoMemoryServer }       = await import('mongodb-memory-server');
const { default: app }            = await import('../src/app.js');
const { default: User }           = await import('../src/models/User.js');
const { default: Role }           = await import('../src/models/Role.js');

let mongoServer;
let activeUser;      // utente attivo riutilizzato nei test
let pendingUser;     // utente pending riutilizzato nei test
let activeRole;      // ruolo creato nel seeding

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    // Seeding ruolo base
    activeRole = await Role.findOneAndUpdate(
        { roleName: 'user' },
        { roleName: 'user', description: 'Utente standard' },
        { upsert: true, new: true }
    );
});

beforeEach(async () => {
    // Crea utente ATTIVO prima di ogni test
    activeUser = await User.create({
        name: 'Mattia',
        surname: 'Test',
        email: 'mattia@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-active-123',
        roles: [activeRole._id],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });

    // Crea utente PENDING prima di ogni test
    pendingUser = await User.create({
        name: 'Pending',
        surname: 'User',
        email: 'pending@prefix.it',
        status: 'pending',
        fingerprintHash: 'fp-pending-456',
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

/**
 * Simula una richiesta autenticata come farebbe il proxy reale:
 * - x-internal-proxy: 'true'  → bypassa il blocco accessi diretti
 * - x-user-id: <id>           → indica l'utente autenticato
 */
const asUser = (method, path, userId) => {
    return request(app)[method](path)
        .set('x-internal-proxy', 'true')
        .set('x-user-id', userId.toString())
        .set('Accept', 'application/json');
};

// ─── TEST ─────────────────────────────────────────────────────────────────────

describe('User Workflow: Recupero Dati', () => {

    describe('GET /api/v1/users/me', () => {

        it('Deve restituire i dati dell\'utente attivo autenticato', async () => {
            const res = await asUser('get', '/api/v1/users/me', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            const u = res.body.user;
            expect(u._id).toBe(activeUser._id.toString());
            expect(u.name).toBe('Mattia');
            expect(u.surname).toBe('Test');
            expect(u.email).toBe('mattia@prefix.it');
            expect(u.status).toBe('active');

            // Verifica che passwordHash NON sia esposto
            expect(u.auth).toBeUndefined();
        });

        it('Deve restituire 403 se l\'utente è in stato pending', async () => {
            // requireActiveUser blocca prima ancora di arrivare al controller
            const res = await asUser('get', '/api/v1/users/me', pendingUser._id);

            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('Utente non attivo');
        });

        it('Deve restituire 401 se non viene passato x-user-id', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('x-internal-proxy', 'true')
                .set('Accept', 'application/json');

            expect(res.statusCode).toEqual(401);
        });

        it('Deve restituire 401 se x-user-id non corrisponde a nessun utente', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await asUser('get', '/api/v1/users/me', fakeId);

            expect(res.statusCode).toEqual(401);
        });

        it('Deve popolare correttamente i ruoli dell\'utente', async () => {
            const res = await asUser('get', '/api/v1/users/me', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user.roles).toBeInstanceOf(Array);
            expect(res.body.user.roles[0].roleName).toBe('user');
            expect(res.body.user.roleIds).toBeInstanceOf(Array);
            expect(res.body.user.roleIds).toHaveLength(1);
        });
    });

    describe('GET /api/v1/users/pending', () => {

it('Deve restituire la lista degli utenti pending', async () => {
    const res = await asUser('get', '/api/v1/users/pending', activeUser._id);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body).toHaveLength(1); 

    expect(res.body[0].email).toBe('pending@prefix.it');
    expect(res.body[0].status).toBe('pending');

    // L'utente attivo non deve apparire
    const emails = res.body.map(u => u.email);
    expect(emails).not.toContain('mattia@prefix.it');
});

        it('Deve restituire 403 se chi chiede è un utente pending', async () => {
            // Un utente pending non supera requireActiveUser
            const res = await asUser('get', '/api/v1/users/pending', pendingUser._id);

            expect(res.statusCode).toEqual(403);
        });
    });
});