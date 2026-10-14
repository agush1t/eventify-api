import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';

// Configurar testing antes de importar la aplicación.
process.env.NODE_ENV = 'test';

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

await mongoose.connect(mongo.getUri());

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: Ticket } = await import('../src/models/Ticket.js');
await Ticket.init();

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

    // Comprobar que la API rechaza datos inválidos al crear eventos.
    const invalidEventBase = {
        title: 'Evento inválido',
        description: 'Prueba de validación',
        category: 'Tecnología',
        date: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        location: 'Buenos Aires',
        capacity: 10,
        price: 1000
    };

    const pastDateResponse = await organizer
        .post('/api/events')
        .send({
            ...invalidEventBase,
            date: new Date(
                Date.now() - 24 * 60 * 60 * 1000
            ).toISOString()
        });

    assert.equal(pastDateResponse.status, 400);

    const zeroCapacityResponse = await organizer
        .post('/api/events')
        .send({
            ...invalidEventBase,
            capacity: 0
        });

    assert.equal(zeroCapacityResponse.status, 400);

    const negativePriceResponse = await organizer
        .post('/api/events')
        .send({
            ...invalidEventBase,
            price: -1
        });

    assert.equal(negativePriceResponse.status, 400);

    const decimalCapacityResponse = await organizer
        .post('/api/events')
        .send({
            ...invalidEventBase,
            capacity: 2.5
        });

    assert.equal(decimalCapacityResponse.status, 400);

    const textPriceResponse = await organizer
        .post('/api/events')
        .send({
            ...invalidEventBase,
            price: 'abc'
        });

    assert.equal(textPriceResponse.status, 400);

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

    // Comprobar que la actualización rechaza una capacidad decimal.
    const decimalCapacityUpdateResponse = await organizer
        .put(`/api/events/${eventId}`)
        .send({ capacity: 2.5 });

    assert.equal(decimalCapacityUpdateResponse.status, 400);

    // Comprobar que la actualización rechaza un precio no numérico.
    const textPriceUpdateResponse = await organizer
        .put(`/api/events/${eventId}`)
        .send({ price: 'abc' });

    assert.equal(textPriceUpdateResponse.status, 400);

    // 6. Publicar el evento.
    const publishResponse = await organizer
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'published' });

    assert.equal(publishResponse.status, 200);
    assert.equal(publishResponse.body.payload.status, 'published');

    // Comprobar filtros y paginación de eventos.
    const filteredEventsResponse = await request(app)
        .get('/api/events?status=published&page=1&limit=1');

    assert.equal(filteredEventsResponse.status, 200);
    assert.ok(Array.isArray(filteredEventsResponse.body.data));
    assert.equal(filteredEventsResponse.body.page, 1);
    assert.equal(filteredEventsResponse.body.limit, 1);
    assert.ok(filteredEventsResponse.body.total >= 1);
    assert.equal(filteredEventsResponse.body.data.length, 1);
    assert.ok(filteredEventsResponse.body.totalPages >= 1);

    assert.ok(
        filteredEventsResponse.body.data.every(
            event => event.status === 'published'
        )
    );

    // Comprobar que la ruta de tickets funciona sin tickets.
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

    // Un usuario no puede inscribirse dos veces al mismo evento.
    const duplicateTicketResponse = await participant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    // Una inscripción duplicada genera un conflicto HTTP 409.
    assert.equal(duplicateTicketResponse.status, 409);

    // Consultar los tickets del evento y comprobar que el usuario
    // relacionado no expone su contraseña.
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

test('logout elimina la cookie y bloquea el acceso a current', async () => {
    const agent = request.agent(app);

    const registration = await agent
        .post('/api/sessions/register')
        .send({
            first_name: 'Usuario',
            last_name: 'Logout',
            email: 'logout.test@example.com',
            password: 'Test123456'
        });

    assert.equal(registration.status, 201);

    const login = await agent
        .post('/api/sessions/login')
        .send({
            email: 'logout.test@example.com',
            password: 'Test123456'
        });

    assert.equal(login.status, 200);
    assert.ok(login.headers['set-cookie']);

    const currentBeforeLogout = await agent
        .get('/api/sessions/current');

    assert.equal(currentBeforeLogout.status, 200);

    const logout = await agent
        .post('/api/sessions/logout');

    assert.equal(logout.status, 200);

    const cookies = logout.headers['set-cookie'] ?? [];

    assert.ok(
        cookies.some(cookie =>
            /currentUser=.*Expires=Thu, 01 Jan 1970|currentUser=.*Max-Age=0/i.test(cookie)
        ),
        'El logout debe eliminar la cookie currentUser'
    );

    const currentAfterLogout = await agent
        .get('/api/sessions/current');

    assert.equal(currentAfterLogout.status, 401);
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

test('el registro público no permite asignarse el rol de administrador', async () => {
    const response = await request(app)
        .post('/api/sessions/register')
        .send({
            first_name: 'Usuario',
            last_name: 'IntentoAdmin',
            email: 'intento.admin.test@example.com',
            password: 'Test123456',
            role: 'admin'
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.payload.role, 'user');
    assert.equal(response.body.payload.password, undefined);

    const savedUser = await User.findOne({
        email: 'intento.admin.test@example.com'
    });

    assert.ok(savedUser);
    assert.equal(savedUser.role, 'user');
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

    // Registrar al propietario del ticket.
    const ownerRegistration = await participant
        .post('/api/sessions/register')
        .send({
            first_name: 'Dueno',
            last_name: 'Ticket',
            email: 'dueno.ticket.test@example.com',
            password: 'Test123456'
        });

    assert.equal(ownerRegistration.status, 201);

    // Registrar al organizador.
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

test('cancelar una inscripción libera el cupo del evento', async () => {
    const firstParticipant = request.agent(app);
    const secondParticipant = request.agent(app);
    const organizer = request.agent(app);

    // Registrar al primer participante.
    const firstRegistration = await firstParticipant
        .post('/api/sessions/register')
        .send({
            first_name: 'Primer',
            last_name: 'Participante',
            email: 'primer.cupo.test@example.com',
            password: 'Test123456'
        });

    assert.equal(firstRegistration.status, 201);

    // Registrar al segundo participante.
    const secondRegistration = await secondParticipant
        .post('/api/sessions/register')
        .send({
            first_name: 'Segundo',
            last_name: 'Participante',
            email: 'segundo.cupo.test@example.com',
            password: 'Test123456'
        });

    assert.equal(secondRegistration.status, 201);

    // Registrar al organizador.
    const organizerRegistration = await organizer
        .post('/api/sessions/register')
        .send({
            first_name: 'Organizador',
            last_name: 'Cupos',
            email: 'organizador.cupos.test@example.com',
            password: 'Test123456'
        });

    assert.equal(organizerRegistration.status, 201);

    await User.updateOne(
        { email: 'organizador.cupos.test@example.com' },
        { $set: { role: 'organizer' } }
    );

    // Iniciar sesión con los tres usuarios.
    const firstLogin = await firstParticipant
        .post('/api/sessions/login')
        .send({
            email: 'primer.cupo.test@example.com',
            password: 'Test123456'
        });

    assert.equal(firstLogin.status, 200);

    const secondLogin = await secondParticipant
        .post('/api/sessions/login')
        .send({
            email: 'segundo.cupo.test@example.com',
            password: 'Test123456'
        });

    assert.equal(secondLogin.status, 200);

    const organizerLogin = await organizer
        .post('/api/sessions/login')
        .send({
            email: 'organizador.cupos.test@example.com',
            password: 'Test123456'
        });

    assert.equal(organizerLogin.status, 200);

    // Crear un evento con capacidad para una sola persona.
    const eventResponse = await organizer
        .post('/api/events')
        .send({
            title: 'Evento de prueba de cupos',
            description: 'Verificar liberación de cupos',
            category: 'Tecnología',
            date: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            location: 'Buenos Aires',
            capacity: 1,
            price: 0
        });

    assert.equal(eventResponse.status, 201);

    const eventId = eventResponse.body.payload.id;
    assert.ok(eventId);

    // Publicar el evento.
    const publishResponse = await organizer
        .patch(`/api/events/${eventId}/status`)
        .send({ status: 'published' });

    assert.equal(publishResponse.status, 200);

    // El primer participante ocupa el único cupo.
    const firstTicket = await firstParticipant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    assert.equal(firstTicket.status, 201);

    const ticketId = firstTicket.body.payload.id;
    assert.ok(ticketId);

    // El segundo participante no puede ocupar el cupo todavía.
    const fullEventResponse = await secondParticipant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    // La falta de cupos genera un conflicto HTTP 409.
    assert.equal(fullEventResponse.status, 409);

    // Cancelar la inscripción del primer participante.
    const cancellationResponse = await firstParticipant
        .patch(`/api/tickets/${ticketId}/cancel`);

    assert.equal(cancellationResponse.status, 200);
    assert.equal(
        cancellationResponse.body.payload.status,
        'cancelled'
    );

    // El segundo participante ahora debe poder inscribirse.
    const secondTicket = await secondParticipant
        .post(`/api/events/${eventId}/tickets`)
        .send({ quantity: 1 });

    assert.equal(secondTicket.status, 201);
    assert.equal(secondTicket.body.payload.status, 'confirmed');
    assert.equal(secondTicket.body.payload.quantity, 1);
});


test('dos reservas simultáneas no superan el último cupo', async () => {
    const { default: Ticket } = await import('../src/models/Ticket.js');
    const { default: User } = await import('../src/models/User.js');
    // Crear los usuarios a través del registro/login público para probar las cookies.
    const organizer = request.agent(app);
    const users = [request.agent(app), request.agent(app)];
    const suffix = Date.now().toString(36);
    for (const [i, agent] of [organizer, ...users].entries()) {
        const email = `race${i}-${suffix}@example.com`;
        assert.equal((await agent.post('/api/sessions/register').send({
            first_name: 'Test', last_name: 'Race', email, password: 'Test123456'
        })).status, 201);
        if (i === 0) await User.updateOne({ email }, { $set: { role: 'organizer' } });
        assert.equal((await agent.post('/api/sessions/login').send({ email, password: 'Test123456' })).status, 200);
    }
    const created = await organizer.post('/api/events').send({
        title: 'Último cupo', description: 'Prueba simultánea', category: 'Test',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: 'Buenos Aires', capacity: 1, price: 0
    });
    assert.equal(created.status, 201);
    const id = created.body.payload.id;
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'published' })).status, 200);
    const responses = await Promise.all(users.map(agent => agent.post(`/api/events/${id}/tickets`).send({ quantity: 1 })));
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
    const saved = await Ticket.find({ event: id, status: 'confirmed' });
    assert.equal(saved.reduce((sum, t) => sum + t.quantity, 0), 1);
});


test('etapa 3: capacidad, estados y permisos de edición', async () => {
    const organizer = request.agent(app);
    const participant = request.agent(app);
    const stranger = request.agent(app);
    const createUser = async (agent, email) => {
        const reg = await agent.post('/api/sessions/register').send({
            first_name: 'Prueba', last_name: 'Etapa3', email, password: 'Test123456'
        });
        assert.equal(reg.status, 201);
    };
    await createUser(organizer, 'organizador.etapa3@example.com');
    await createUser(participant, 'participante.etapa3@example.com');
    await createUser(stranger, 'extrano.etapa3@example.com');
    await User.updateOne({ email: 'organizador.etapa3@example.com' }, { $set: { role: 'organizer' } });
    for (const [agent, email] of [
        [organizer, 'organizador.etapa3@example.com'],
        [participant, 'participante.etapa3@example.com'],
        [stranger, 'extrano.etapa3@example.com']
    ]) {
        assert.equal((await agent.post('/api/sessions/login').send({ email, password: 'Test123456' })).status, 200);
    }
    const eventResponse = await organizer.post('/api/events').send({
        title: 'Evento etapa 3', description: 'Control de capacidad', category: 'Tecnología',
        location: 'Buenos Aires', date: new Date(Date.now() + 86400000 * 30).toISOString(),
        capacity: 2, price: 0
    });
    assert.equal(eventResponse.status, 201);
    const id = eventResponse.body.payload.id;
    assert.equal((await stranger.put(`/api/events/${id}`).send({ capacity: 3 })).status, 403);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'finished' })).status, 400);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'published' })).status, 200);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'draft' })).status, 400);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'finished' })).status, 400);
    assert.equal((await participant.post(`/api/events/${id}/tickets`).send({ quantity: 2 })).status, 201);
    assert.equal((await organizer.put(`/api/events/${id}`).send({ capacity: 1 })).status, 409);
    assert.equal((await organizer.put(`/api/events/${id}`).send({ capacity: 2 })).status, 200);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'cancelled' })).status, 200);
    assert.equal((await organizer.patch(`/api/events/${id}/status`).send({ status: 'published' })).status, 400);
    assert.equal((await organizer.put(`/api/events/${id}`).send({ title: 'Nuevo' })).status, 400);
});

test('etapa 3: valida textos vacíos y límite de paginación', async () => {
    const response = await request(app).get('/api/events?limit=101');
    assert.equal(response.status, 400);
});


test('etapa 4: cookie y JWT expiran de manera coherente', async () => {
    const jwt = await import('jsonwebtoken');
    const { default: config } = await import('../src/config/config.js');
    const email = `etapa4-cookie-${Date.now()}@example.com`;
    const agent = request.agent(app);
    assert.equal((await agent.post('/api/sessions/register').send({
        first_name: 'Cookie', last_name: 'Test', email, password: 'Test123456'
    })).status, 201);
    const response = await agent.post('/api/sessions/login').send({ email, password: 'Test123456' });
    assert.equal(response.status, 200);
    const cookie = response.headers['set-cookie'].find(value => value.startsWith('currentUser='));
    assert.ok(cookie);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Max-Age=3600(?:;|$)/i);
    const token = decodeURIComponent(cookie.split(';')[0].split('=').slice(1).join('='));
    const decoded = jwt.default.verify(token, config.jwtSecret);
    assert.equal(decoded.exp - decoded.iat, 3600);
});

test('etapa 4: token expirado o manipulado no permite acceder a current', async () => {
    const jwt = await import('jsonwebtoken');
    const { default: config } = await import('../src/config/config.js');
    const expired = jwt.default.sign({ id: new mongoose.Types.ObjectId().toString() }, config.jwtSecret, { expiresIn: -1 });
    const expiredResponse = await request(app).get('/api/sessions/current').set('Cookie', `currentUser=${expired}`);
    assert.equal(expiredResponse.status, 401);
    const invalidResponse = await request(app).get('/api/sessions/current').set('Cookie', 'currentUser=token-invalido');
    assert.equal(invalidResponse.status, 401);
});

test('etapa 5: catálogo público muestra únicamente publicados y protege detalles', async () => {
    const owner = await User.create({ first_name: 'Owner', last_name: 'Stage5', email: `owner5-${Date.now()}@example.com`, password: 'hash', role: 'organizer' });
    const { default: Event } = await import('../src/models/Event.js');
    const base = { description: 'Descripción', category: 'Tecnología', location: 'Buenos Aires', date: new Date(Date.now() + 86400000 * 30), capacity: 10, price: 0, organizer: owner._id };
    const draft = await Event.create({ ...base, title: 'Privado etapa5', status: 'draft' });
    const published = await Event.create({ ...base, title: 'Público etapa5', status: 'published' });
    const cancelled = await Event.create({ ...base, title: 'Cancelado etapa5', status: 'cancelled' });
    const listing = await request(app).get('/api/events');
    assert.equal(listing.status, 200);
    assert.ok(listing.body.data.some(event => event.id === published.id));
    assert.ok(!listing.body.data.some(event => event.id === draft.id || event.id === cancelled.id));
    assert.equal((await request(app).get(`/api/events/${draft.id}`)).status, 404);
    assert.equal((await request(app).get(`/api/events/${cancelled.id}`)).status, 404);
    assert.equal((await request(app).get(`/api/events/${published.id}`)).status, 200);
    assert.equal((await request(app).get('/api/events/mine')).status, 401);
    assert.equal((await request(app).get('/api/events/admin/all')).status, 401);
});

test('etapa 5: filtros inválidos devuelven 400', async () => {
    for (const query of [
        '?status=inexistente', '?status=draft', '?organizer=incorrecto',
        '?dateFrom=hola', '?dateFrom=2027-12-01&dateTo=2027-01-01',
        '?dateFrom=2027-02-30', '?status[]=published', '?page=0', '?limit=101'
    ]) {
        const response = await request(app).get(`/api/events${query}`);
        assert.equal(response.status, 400, `Debe rechazar ${query}`);
    }
});

test('etapa 5: organizador solo consulta sus eventos y admin consulta todos', async () => {
    const owner = await User.create({ first_name: 'Owner', last_name: 'Stage5', email: `owner5-auth-${Date.now()}@example.com`, password: 'hash', role: 'organizer' });
    const other = await User.create({ first_name: 'Other', last_name: 'Stage5', email: `other5-${Date.now()}@example.com`, password: 'hash', role: 'organizer' });
    const admin = await User.create({ first_name: 'Admin', last_name: 'Stage5', email: `admin5-${Date.now()}@example.com`, password: 'hash', role: 'admin' });
    const { default: Event } = await import('../src/models/Event.js');
    const { default: config } = await import('../src/config/config.js');
    const jwt = await import('jsonwebtoken');
    const base = { description: 'Descripción', category: 'Tecnología', location: 'Buenos Aires', date: new Date(Date.now() + 86400000 * 30), capacity: 10, price: 0, status: 'draft' };
    const ownEvent = await Event.create({ ...base, title: 'Mío etapa5', organizer: owner._id });
    const otherEvent = await Event.create({ ...base, title: 'Otro etapa5', organizer: other._id });
    const cookie = user => `currentUser=${jwt.default.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' })}`;
    const mine = await request(app).get('/api/events/mine').set('Cookie', cookie(owner));
    assert.equal(mine.status, 200);
    assert.ok(mine.body.data.some(event => event.id === ownEvent.id));
    assert.ok(!mine.body.data.some(event => event.id === otherEvent.id));
    assert.equal((await request(app).get(`/api/events/manage/${ownEvent.id}`).set('Cookie', cookie(owner))).status, 200);
    assert.equal((await request(app).get(`/api/events/manage/${otherEvent.id}`).set('Cookie', cookie(owner))).status, 403);
    assert.equal((await request(app).get('/api/events/admin/all').set('Cookie', cookie(owner))).status, 403);
    const all = await request(app).get('/api/events/admin/all').set('Cookie', cookie(admin));
    assert.equal(all.status, 200);
    assert.ok(all.body.data.some(event => event.id === ownEvent.id));
    assert.ok(all.body.data.some(event => event.id === otherEvent.id));
});
