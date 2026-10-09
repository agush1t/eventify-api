
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

// Configurar testing antes de importar la aplicación.
process.env.NODE_ENV = 'test';

const mongo = await MongoMemoryServer.create();

await mongoose.connect(mongo.getUri());

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');

after(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

test('flujo completo: registro, login, evento, ticket y cancelación', async () => {
    const participant = request.agent(app);
    const organizer = request.agent(app);

    // 1. Registrar al participante.
    const participantRegistration = await participant
        .post('/api/sessions/register')
        .send({
            first_name: 'Participante',
            last_name: 'Test',
            email: 'participante.test@example.com',
            password: 'Test123456'
        });

    assert.equal(participantRegistration.status, 201);
    assert.equal(
        participantRegistration.body.payload.email,
        'participante.test@example.com'
    );
    assert.equal(participantRegistration.body.payload.role, 'user');
    assert.equal(participantRegistration.body.payload.password, undefined);

    // 2. Registrar al organizador.
    const organizerRegistration = await organizer
        .post('/api/sessions/register')
        .send({
            first_name: 'Organizador',
            last_name: 'Test',
            email: 'organizador.test@example.com',
            password: 'Organizer123456'
        });

    assert.equal(organizerRegistration.status, 201);
    assert.equal(organizerRegistration.body.payload.password, undefined);

    // Promoverlo únicamente dentro de la base temporal.
    await User.updateOne(
        { email: 'organizador.test@example.com' },
        { $set: { role: 'organizer' } }
    );

    // 3. Iniciar sesión con ambos usuarios.
    const participantLogin = await participant
        .post('/api/sessions/login')
        .send({
            email: 'participante.test@example.com',
            password: 'Test123456'
        });

    assert.equal(participantLogin.status, 200);
    assert.ok(
        participantLogin.headers['set-cookie'],
        'El login debe establecer la cookie de autenticación'
    );

    const organizerLogin = await organizer
        .post('/api/sessions/login')
        .send({
            email: 'organizador.test@example.com',
            password: 'Organizer123456'
        });

    assert.equal(organizerLogin.status, 200);
    assert.ok(organizerLogin.headers['set-cookie']);

    // 4. Comprobar el endpoint current del participante.
    const currentResponse = await participant
        .get('/api/sessions/current');

    assert.equal(currentResponse.status, 200);
    assert.equal(
        currentResponse.body.payload.email,
        'participante.test@example.com'
    );
    assert.equal(currentResponse.body.payload.password, undefined);

    // 5. Crear un evento futuro.
    const eventResponse = await organizer
        .post('/api/events')
        .send({
            title: 'Evento de integración',
            description: 'Evento creado durante las pruebas',
            category: 'Tecnología',
            date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: 'Buenos Aires',
            capacity: 10,
            price: 1000
        });

    assert.equal(eventResponse.status, 201);
    assert.ok(eventResponse.body.payload.id);

    const eventId = eventResponse.body.payload.id;

    assert.equal(eventResponse.body.payload.status, 'draft');
    assert.equal(eventResponse.body.payload.password, undefined);

    // 6. Publicar el evento.
    const publishResponse = await organizer
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'published' });

    assert.equal(publishResponse.status, 200);
    assert.equal(publishResponse.body.payload.status, 'published');

    // Comprobar que la ruta de tickets del evento funciona sin tickets.
    const emptyEventTicketsResponse = await organizer
        .get(`/api/events/${eventId}/tickets`);

    assert.equal(emptyEventTicketsResponse.status, 200);
    assert.deepEqual(emptyEventTicketsResponse.body.payload, []);

    // 7. Inscribir al participante.
    const ticketResponse = await participant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    assert.equal(ticketResponse.status, 201);
    assert.equal(ticketResponse.body.payload.status, 'confirmed');

    const ticketId = ticketResponse.body.payload.id;

    assert.ok(ticketId);
    assert.equal(ticketResponse.body.payload.quantity, 1);
    assert.equal(ticketResponse.body.payload.password, undefined);

    // Consultar los tickets del evento: el usuario relacionado debe estar sanitizado.
    const eventTicketsResponse = await organizer
        .get(`/api/events/${eventId}/tickets`);

    assert.equal(eventTicketsResponse.status, 200);
    assert.equal(eventTicketsResponse.body.payload.length, 1);

    const populatedUser = eventTicketsResponse.body.payload[0].user;

    assert.ok(populatedUser);
    assert.equal(
        populatedUser.email,
        'participante.test@example.com'
    );
    assert.ok(populatedUser.id);
    assert.equal(populatedUser.password, undefined);

    // 8. Verificar que el ticket aparece en mis inscripciones.
    const myTicketsResponse = await participant
        .get('/api/tickets/my-tickets');

    assert.equal(myTicketsResponse.status, 200);
    assert.equal(myTicketsResponse.body.payload.length, 1);
    assert.equal(
        myTicketsResponse.body.payload[0].password,
        undefined
    );

    // El usuario autenticado no debe recibir la contraseña en sus datos.
    assert.equal(
        myTicketsResponse.body.payload[0].user?.password,
        undefined
    );

    // 9. Cancelar el ticket.
    const cancellationResponse = await participant
        .patch(`/api/tickets/${ticketId}/cancel`);

    assert.equal(cancellationResponse.status, 200);
    assert.equal(
        cancellationResponse.body.payload.status,
        'cancelled'
    );
    assert.equal(
        cancellationResponse.body.payload.password,
        undefined
    );

    // 10. Confirmar que la inscripción figura como cancelada.
    const ticketsAfterCancellation = await participant
        .get('/api/tickets/my-tickets');

    assert.equal(ticketsAfterCancellation.status, 200);
    assert.equal(ticketsAfterCancellation.body.payload.length, 1);
    assert.equal(
        ticketsAfterCancellation.body.payload[0].status,
        'cancelled'
    );
    assert.equal(
        ticketsAfterCancellation.body.payload[0].password,
        undefined
    );
});

test('rechaza el acceso a current sin autenticación', async () => {
    const response = await request(app)
        .get('/api/sessions/current');

    assert.equal(response.status, 401);
});

test('rechaza el login con credenciales incorrectas', async () => {
    const response = await request(app)
        .post('/api/sessions/login')
        .send({
            email: 'usuario.inexistente@example.com',
            password: 'ClaveIncorrecta123'
        });

    assert.equal(response.status, 401);
});

test('rechaza el registro de un email duplicado', async () => {
    const email = 'duplicado.test@example.com';

    const userData = {
        first_name: 'Usuario',
        last_name: 'Duplicado',
        email,
        password: 'Test123456'
    };

    const firstRegistration = await request(app)
        .post('/api/sessions/register')
        .send(userData);

    assert.equal(firstRegistration.status, 201);

    const secondRegistration = await request(app)
        .post('/api/sessions/register')
        .send(userData);

    assert.equal(secondRegistration.status, 409);
});

test('un usuario común no puede crear eventos', async () => {
    const userAgent = request.agent(app);

    const registration = await userAgent
        .post('/api/sessions/register')
        .send({
            first_name: 'Usuario',
            last_name: 'SinPermisos',
            email: 'sin.permisos.test@example.com',
            password: 'Test123456'
        });

    assert.equal(registration.status, 201);

    const login = await userAgent
        .post('/api/sessions/login')
        .send({
            email: 'sin.permisos.test@example.com',
            password: 'Test123456'
        });

    assert.equal(login.status, 200);

    const eventResponse = await userAgent
        .post('/api/events')
        .send({
            title: 'Evento no autorizado',
            description: 'No debería crearse',
            category: 'Tecnología',
            date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: 'Buenos Aires',
            capacity: 10,
            price: 1000
        });

    assert.equal(eventResponse.status, 403);
});

test('un usuario no puede cancelar el ticket de otra persona', async () => {
    const participant = request.agent(app);
    const organizer = request.agent(app);
    const otherParticipant = request.agent(app);

    // Registrar participante propietario del ticket.
    const ownerRegistration = await participant
        .post('/api/sessions/register')
        .send({
            first_name: 'Dueno',
            last_name: 'Ticket',
            email: 'dueno.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(ownerRegistration.status, 201);

    // Registrar organizador.
    const organizerRegistration = await organizer
        .post('/api/sessions/register')
        .send({
            first_name: 'Organizador',
            last_name: 'Ticket',
            email: 'organizador.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(organizerRegistration.status, 201);

    await User.updateOne(
        { email: 'organizador.ticket.test@example.com' },
        { $set: { role: 'organizer' } }
    );

    // Registrar a otra persona que intentará cancelar el ticket.
    const otherRegistration = await otherParticipant
        .post('/api/sessions/register')
        .send({
            first_name: 'Otro',
            last_name: 'Usuario',
            email: 'otro.usuario.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(otherRegistration.status, 201);

    // Iniciar las sesiones.
    const ownerLogin = await participant
        .post('/api/sessions/login')
        .send({
            email: 'dueno.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(ownerLogin.status, 200);

    const organizerLogin = await organizer
        .post('/api/sessions/login')
        .send({
            email: 'organizador.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(organizerLogin.status, 200);

    const otherLogin = await otherParticipant
        .post('/api/sessions/login')
        .send({
            email: 'otro.usuario.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(otherLogin.status, 200);

    // Crear y publicar un evento.
    const eventResponse = await organizer
        .post('/api/events')
        .send({
            title: 'Evento para probar permisos',
            description: 'Prueba de propiedad del ticket',
            category: 'Tecnología',
            date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: 'Buenos Aires',
            capacity: 10,
            price: 1000
        });

    assert.equal(eventResponse.status, 201);

    const eventId = eventResponse.body.payload.id;
    assert.ok(eventId);

    const publishResponse = await organizer
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'published' });

    assert.equal(publishResponse.status, 200);

    // El propietario se inscribe.
    const ticketResponse = await participant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    assert.equal(ticketResponse.status, 201);

    const ticketId = ticketResponse.body.payload.id;
    assert.ok(ticketId);

    // Otra persona intenta cancelar el ticket.
    const cancellationResponse = await otherParticipant
        .patch(`/api/tickets/${ticketId}/cancel`);

    assert.equal(cancellationResponse.status, 403);

    // Verificar que el ticket continúa confirmado.
    const ownerTickets = await participant
        .get('/api/tickets/my-tickets');

    assert.equal(ownerTickets.status, 200);
    assert.equal(ownerTickets.body.payload.length, 1);
    assert.equal(
        ownerTickets.body.payload[0].status,
        'confirmed'
    );
    assert.equal(
        ownerTickets.body.payload[0].password,
        undefined
    );
});
