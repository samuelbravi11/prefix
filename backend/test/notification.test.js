// test/notification.test.js

const { default: request }        = await import('supertest');
const { default: mongoose }       = await import('mongoose');
const { MongoMemoryServer }       = await import('mongodb-memory-server');
const { default: app }            = await import('../src/app.js');
const { default: User }           = await import('../src/models/User.js');
const { default: Notification }   = await import('../src/models/Notification.js');

let mongoServer;
let activeUser;

// ─── SETUP / TEARDOWN ────────────────────────────────────────────────────────

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
    activeUser = await User.create({
        name: 'Test',
        surname: 'User',
        email: 'test@prefix.it',
        status: 'active',
        fingerprintHash: 'fp-test-123',
        roles: [],
        buildingIds: [],
        auth: { passwordHash: 'hash-placeholder' }
    });
});

afterEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
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

describe('Notifications Workflow', () => {

    describe('GET /api/v1/notifications', () => {

        it('Deve restituire le notifiche destinate all\'utente', async () => {
            await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: activeUser._id },
                title: 'Account attivato',
                message: 'Il tuo account è stato attivato',
                priority: 'medium'
            });

            const res = await asUser('get', '/api/v1/notifications', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe('Account attivato');
        });

        it('Deve restituire array vuoto se non ci sono notifiche', async () => {
            const res = await asUser('get', '/api/v1/notifications', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body).toHaveLength(0);
        });

        it('Deve restituire solo le notifiche non lette con ?not_read=true', async () => {
            await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: activeUser._id },
                title: 'Notifica letta',
                message: 'Già letta',
                read: true
            });

            await Notification.create({
                type: 'REGISTRAZIONE_UTENTE',
                recipient: { userId: activeUser._id },
                title: 'Notifica non letta',
                message: 'Da leggere',
                read: false
            });

            const res = await asUser('get', '/api/v1/notifications?not_read=true', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe('Notifica non letta');
        });

        it('Non deve restituire notifiche di altri utenti', async () => {
            const otherUser = await User.create({
                name: 'Other',
                surname: 'User',
                email: 'other@prefix.it',
                status: 'active',
                fingerprintHash: 'fp-other-999',
                roles: [],
                buildingIds: [],
                auth: { passwordHash: 'hash-placeholder' }
            });

            await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: otherUser._id },
                title: 'Notifica altro utente',
                message: 'Non deve essere visibile',
            });

            const res = await asUser('get', '/api/v1/notifications', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(0);
        });
    });

    describe('PATCH /api/v1/notifications/:id/read', () => {

        it('Deve segnare una notifica come letta', async () => {
            const notif = await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: activeUser._id },
                title: 'Da leggere',
                message: 'Messaggio',
                read: false
            });

            const res = await asUser('patch', `/api/v1/notifications/${notif._id}/read`, activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Verifica diretta sul DB
            const updated = await Notification.findById(notif._id);
            expect(updated.read).toBe(true);
        });

        it('Deve restituire 404 se la notifica non esiste', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const res = await asUser('patch', `/api/v1/notifications/${fakeId}/read`, activeUser._id);

            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Notifica non trovata');
        });

        it('Non deve segnare come letta una notifica di un altro utente', async () => {
            const otherUser = await User.create({
                name: 'Other',
                surname: 'User',
                email: 'other@prefix.it',
                status: 'active',
                fingerprintHash: 'fp-other-888',
                roles: [],
                buildingIds: [],
                auth: { passwordHash: 'hash-placeholder' }
            });

            const notif = await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: otherUser._id },
                title: 'Notifica altro utente',
                message: 'Non accessibile',
                read: false
            });

            const res = await asUser('patch', `/api/v1/notifications/${notif._id}/read`, activeUser._id);

            expect(res.statusCode).toEqual(404);
        });
    });

    describe('PATCH /api/v1/notifications/read-all', () => {

        it('Deve segnare tutte le notifiche dell\'utente come lette', async () => {
            await Notification.create([
                {
                    type: 'ATTIVAZIONE_UTENTE',
                    recipient: { userId: activeUser._id },
                    title: 'Notifica 1',
                    message: 'Msg 1',
                    read: false
                },
                {
                    type: 'REGISTRAZIONE_UTENTE',
                    recipient: { userId: activeUser._id },
                    title: 'Notifica 2',
                    message: 'Msg 2',
                    read: false
                }
            ]);

            const res = await asUser('patch', '/api/v1/notifications/read-all', activeUser._id);

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);

            // Verifica diretta sul DB
            const unread = await Notification.countDocuments({
                'recipient.userId': activeUser._id,
                read: false
            });
            expect(unread).toBe(0);
        });

        it('Non deve modificare le notifiche di altri utenti', async () => {
            const otherUser = await User.create({
                name: 'Other',
                surname: 'User',
                email: 'other@prefix.it',
                status: 'active',
                fingerprintHash: 'fp-other-777',
                roles: [],
                buildingIds: [],
                auth: { passwordHash: 'hash-placeholder' }
            });

            await Notification.create({
                type: 'ATTIVAZIONE_UTENTE',
                recipient: { userId: otherUser._id },
                title: 'Notifica altro utente',
                message: 'Non deve essere modificata',
                read: false
            });

            await asUser('patch', '/api/v1/notifications/read-all', activeUser._id);

            // La notifica dell'altro utente deve restare non letta
            const otherNotif = await Notification.findOne({
                'recipient.userId': otherUser._id
            });
            expect(otherNotif.read).toBe(false);
        });
    });
});