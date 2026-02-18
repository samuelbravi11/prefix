// 1. IMPORT DINAMICI
// requireAuth è commentato/inutilizzato, quindi il mock è stato rimosso
const { default: request } = await import('supertest');
const { default: mongoose } = await import('mongoose');
const { MongoMemoryServer } = await import('mongodb-memory-server');
const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Role } = await import('../src/models/Role.js');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(uri);

    // SEEDING: Crea il ruolo 'pending' necessario al controller di registrazione
    await Role.findOneAndUpdate(
        { roleName: 'pending' },
        { roleName: 'pending', description: 'Default role' },
        { upsert: true }
    );
});

afterEach(async () => {
    await User.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Auth Workflow: Registration & Approval', () => {

    const userData = {
        name: 'prova',
        surname: 'Test',
        email: 'prova@prefix.it',
        password: 'Password123!',
        fingerprintHash: 'browser-fingerprint-xyz-123'
    };

    // Helper per aggiungere gli header necessari (bypass proxy)
    const authRequest = (method, path) => {
        return request(app)[method](path)
            .set('x-internal-proxy', 'true')
            .set('Accept', 'application/json');
    };

    it('STEP 1: Registrazione -> Deve creare utente in stato pending', async () => {
        const res = await authRequest('post', '/auth/register')
            .send(userData);

        if (res.statusCode !== 201) {
            console.log("DEBUG Error Body:", res.body);
        }

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toMatch(/Registrazione completata|In attesa di approvazione/i);
    });

    it('STEP 2: Login Prematuro -> Deve restituire 403', async () => {
        // Registriamo l'utente
        await authRequest('post', '/auth/register').send(userData);

        // Tentativo di login
        const res = await authRequest('post', '/auth/login')
            .send({
                email: userData.email,
                password: userData.password,
                fingerprintHash: userData.fingerprintHash
            });

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toBe("Account non attivo. Contatta un amministratore.");
    });

    it('STEP 3: Approvazione Admin & Login -> Successo', async () => {
        // 1. Registrazione
        await authRequest('post', '/auth/register').send(userData);

        // 2. Simulazione approvazione Admin su DB
        const user = await User.findOne({ email: userData.email });
        if (!user) throw new Error("Utente non trovato nel database durante lo STEP 3");

        user.status = 'active';
        await user.save();

        // 3. Login finale
        const res = await authRequest('post', '/auth/login')
            .send({
                email: userData.email,
                password: userData.password,
                fingerprintHash: userData.fingerprintHash
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
    });
});