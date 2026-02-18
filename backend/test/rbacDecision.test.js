// test/rbacDecision.test.js

const { default: request }        = await import('supertest');
const { default: mongoose }       = await import('mongoose');
const { MongoMemoryServer }       = await import('mongodb-memory-server');
const { default: app }            = await import('../src/app.js');
const { default: User }           = await import('../src/models/User.js');
const { default: Role }           = await import('../src/models/Role.js');
const { default: Permission }     = await import('../src/models/Permission.js');
const { default: RoleHierarchy }  = await import('../src/models/RoleHierarchy.js');

let mongoServer;

// Entità riutilizzate nei test
let permViewDashboard;
let permManageUsers;
let roleAdmin;
let roleTechnician;
let roleViewer;
let activeUser;
let userNoRoles;

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    // Seeding permessi
    permViewDashboard = await Permission.create({
        name: 'dashboard:view',
        description: 'Visualizza dashboard'
    });

    permManageUsers = await Permission.create({
        name: 'users:manage',
        description: 'Gestisci utenti'
    });

    // Seeding ruoli con permessi
    roleAdmin = await Role.create({
        roleName: 'admin',
        permission: [permViewDashboard._id, permManageUsers._id]
    });

    roleTechnician = await Role.create({
        roleName: 'technician',
        permission: [permViewDashboard._id]
    });

    // Ruolo senza permessi
    roleViewer = await Role.create({
        roleName: 'viewer',
        permission: []
    });
});

beforeEach(async () => {
    // Utente con ruolo admin
    activeUser = await User.create({
        name: 'Admin',
        surname: 'Test',
        email: 'admin@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-admin-123',
        roles: [roleAdmin._id],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });

    // Utente senza ruoli
    userNoRoles = await User.create({
        name: 'NoRole',
        surname: 'User',
        email: 'norole@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-norole-456',
        roles: [],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await RoleHierarchy.deleteMany({});
});

afterAll(async () => {
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await mongoose.disconnect();
    await mongoServer.stop();
});

// ─── HELPER ──────────────────────────────────────────────────────────────────

// /rbac/decide è una route pubblica (prima di requireActiveUser)
// non richiede x-user-id, solo x-internal-proxy
const rbacRequest = (body) => {
    return request(app)
        .post('/rbac/decide')
        .set('x-internal-proxy', 'true')
        .set('Accept', 'application/json')
        .send(body);
};

// ─── TEST ─────────────────────────────────────────────────────────────────────

describe('RBAC Decision: PDP', () => {

    describe('PERMIT - Accesso concesso', () => {

        it('Deve restituire PERMIT se l\'utente ha il permesso richiesto', async () => {
            const res = await rbacRequest({
                userId: activeUser._id,
                permission: 'dashboard:view'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(true);
            expect(res.body.reason).toBe('Permission granted');
        });

        it('Deve restituire PERMIT per tutti i permessi del ruolo admin', async () => {
            const res = await rbacRequest({
                userId: activeUser._id,
                permission: 'users:manage'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(true);
        });
    });

    describe('DENY - Accesso negato', () => {

        it('Deve restituire DENY se l\'utente non ha il permesso richiesto', async () => {
            // Utente con ruolo technician (solo dashboard:view, non users:manage)
            const techUser = await User.create({
                name: 'Tech',
                surname: 'User',
                email: 'tech@prefix.it',
                status: 'active',
                fingerprintHash: 'fp-tech-789',
                roles: [roleTechnician._id],
                buildingIds: [],
                auth: { passwordHash: 'hash-placeholder' }
            });

            const res = await rbacRequest({
                userId: techUser._id,
                permission: 'users:manage'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
            expect(res.body.reason).toBe('User lacks required permission');
        });

        it('Deve restituire DENY se l\'utente non ha ruoli assegnati', async () => {
            const res = await rbacRequest({
                userId: userNoRoles._id,
                permission: 'dashboard:view'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
        });

        it('Deve restituire DENY se l\'utente non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await rbacRequest({
                userId: fakeId,
                permission: 'dashboard:view'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
            expect(res.body.reason).toBe('User not found');
        });

        it('Deve restituire DENY se userId è mancante', async () => {
            const res = await rbacRequest({
                permission: 'dashboard:view'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
            expect(res.body.reason).toBe('Missing parameters');
        });

        it('Deve restituire DENY se permission è mancante', async () => {
            const res = await rbacRequest({
                userId: activeUser._id
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
            expect(res.body.reason).toBe('Missing parameters');
        });

        it('Deve restituire DENY se il ruolo non ha permessi', async () => {
            const viewerUser = await User.create({
                name: 'Viewer',
                surname: 'User',
                email: 'viewer@prefix.it',
                status: 'active',
                fingerprintHash: 'fp-viewer-000',
                roles: [roleViewer._id],
                buildingIds: [],
                auth: { passwordHash: 'hash-placeholder' }
            });

            const res = await rbacRequest({
                userId: viewerUser._id,
                permission: 'dashboard:view'
            });

            expect(res.statusCode).toEqual(200);
            expect(res.body.allow).toBe(false);
        });
    });

describe('RBAC con gerarchia ruoli', () => {

    it('Deve ereditare i permessi del ruolo padre', async () => {
        // Creiamo un ruolo figlio senza permessi diretti
        const roleChild = await Role.create({
            roleName: 'child_role',
            permission: []
        });

        // roleAdmin è il padre, roleChild è il figlio
        // resolveAllRoles parte da roleAdmin e scende trovando anche roleChild
        await RoleHierarchy.create({
            parentRole: roleAdmin._id,
            childRole: roleChild._id
        });

        // L'utente ha roleAdmin direttamente
        // resolveAllRoles trova sia roleAdmin che roleChild
        // roleAdmin ha dashboard:view → PERMIT
        const childUser = await User.create({
            name: 'Child',
            surname: 'User',
            email: 'child@prefix.it',
            status: 'active',
            fingerprintHash: 'fp-child-hier',
            roles: [roleAdmin._id],
            buildingIds: [],
            auth: { passwordHash: 'hash-placeholder' }
        });

        const res = await rbacRequest({
            userId: childUser._id,
            permission: 'dashboard:view'
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.allow).toBe(true);
    });
});
});