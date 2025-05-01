const express = require('express');
const app = express();
const supabase = require('./supabase');
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
    const { email, password, name, surname, alias } = req.body;

    // Validación de campos obligatorios
    if (!name || !surname || !alias || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validación del formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    // Validación de la longitud de la contraseña
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    if (userId) {
        await supabase.from('clients').insert([{
            id: userId,
            email,
            name,
            surname,
            alias,
            role: 'cliente'
        }]);
    }
    res.json({ success: true });
});

// Ruta para registrar un nuevo restaurante
app.post('/register-restaurant', async (req, res) => {
    const { email, password, name, address, city, phone, total_tables, total_capacity } = req.body;

    // Validación de campos obligatorios
    if (!email || !password || !name || !address || !city || !phone || !total_tables || !total_capacity) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Validación de valores numéricos
    if (total_tables <= 0 || total_capacity <= 0) {
        return res.status(400).json({ error: 'El número de mesas y la capacidad total deben ser mayores a 0.' });
    }

    // Validación del formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    if (userId) {
        await supabase.from('restaurants').insert([{
            id: userId,
            email,
            name,
            address,
            city,
            phone,
            total_tables,
            total_capacity,
            role: 'restaurante'
        }]);
    }
    res.json({ success: true });
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: error.message });
    }

    const userId = data.user?.id;
    let role = null;
    if (userId) {
        // Buscamos el rol en la tabla de clientes
        const { data: client } = await supabase.from('clients').select('role').eq('id', userId).single();
        if (client) {
            role = client.role;
        } else {
            // Si no es cliente, buscamos en la tabla de restaurantes
            const { data: restaurant } = await supabase.from('restaurants').select('role').eq('id', userId).single();
            role = restaurant?.role || null;
        }
    }
    res.json({ ...data, role });
});

// Ruta para obtener todos los restaurantes
app.get('/restaurants', async (req, res) => {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error) return res.status(500).json({ error });
    res.json(data);
});

// Ruta para actualizar los datos de un restaurante concreto por su ID
app.put('/restaurants/:id', async (req, res) => {
    const { total_tables, total_capacity } = req.body;
    const { id } = req.params;

    // Validación de valores
    if (!total_tables || !total_capacity || total_tables <= 0 || total_capacity <= 0) {
        return res.status(400).json({ error: 'El número de mesas y la capacidad total deben ser mayores a 0.' });
    }

    const { error } = await supabase
        .from('restaurants')
        .update({ total_tables, total_capacity })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Ruta para obtener los datos del restaurante asociado al usuario autenticado (restaurante logueado)
app.get('/my-restaurant', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'No autorizado' });

    const { data: restaurantes, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', user.id)

    if (error || !restaurantes || restaurantes.length === 0) {
        return res.status(404).json({ error: 'No tienes restaurante asociado' });
    }
    res.json(restaurantes[0]);
});

// Ruta para obtener las reservas de un restaurante
app.get('/restaurants/:id/reservations', async (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .select('*, clients(name, email)')
        .eq('restaurant_id', id)
        .gte('reservation_time', now)
        .order('reservation_time', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Ruta para crear una reserva
app.post('/reservations', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'No autorizado' });

    const {
        restaurant_id,
        reservation_name,
        reservation_time,
        number_of_guests,
        phone,
        credit_card
    } = req.body;

    // 1. Validamos las horas y minutos permitidos y calculamos que turno es
    const fechaObj = new Date(reservation_time);
    const ahora = new Date();
    const hora = fechaObj.getHours();
    const minutos = fechaObj.getMinutes();
    const dia = fechaObj.toISOString().split('T')[0];
    const minutosValidos = [0, 15, 30, 45];

    if (fechaObj < ahora) {
        return res.status(400).json({ error: 'No puedes reservar para una fecha y hora anterior a la actual.' });
    }

    let turnoInicio, turnoFin;
    if (hora >= 13 && hora <= 15 && minutosValidos.includes(minutos)) {
        turnoInicio = `${dia}T13:00:00`;
        turnoFin = `${dia}T15:45:00`;
    } else if (hora >= 20 && hora <= 22 && minutosValidos.includes(minutos)) {
        turnoInicio = `${dia}T20:00:00`;
        turnoFin = `${dia}T22:45:00`;
    } else if ((hora === 15 || hora === 22) && minutos === 45) {
        if (hora === 15) {
            turnoInicio = `${dia}T13:00:00`;
            turnoFin = `${dia}T15:45:00`;
        } else {
            turnoInicio = `${dia}T20:00:00`;
            turnoFin = `${dia}T22:45:00`;
        }
    } else {
        return res.status(400).json({ error: 'Hora de reserva no permitida.' });
    }

    // 2. Obtenemos los datos del restaurante
    const { data: restaurante } = await supabase
        .from('restaurants')
        .select('total_tables, total_capacity')
        .eq('id', restaurant_id)
        .single();

    if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    // 3. Contamos las reservas para ese restaurante por día y turno
    const { data: reservas } = await supabase
        .from('reservations')
        .select('id, number_of_guests')
        .eq('restaurant_id', restaurant_id)
        .in('status', ['pending', 'accepted'])
        .gte('reservation_time', turnoInicio)
        .lte('reservation_time', turnoFin);

    const mesasReservadas = reservas.length;
    const comensalesReservados = reservas.reduce((sum, r) => sum + r.number_of_guests, 0);

    if (mesasReservadas >= restaurante.total_tables) {
        return res.status(400).json({ error: 'No hay mesas disponibles para ese turno.' });
    }
    if ((comensalesReservados + number_of_guests) > restaurante.total_capacity) {
        return res.status(400).json({ error: 'No hay suficiente capacidad para esa cantidad de comensales en ese turno.' });
    }

    // 4. Insertamos la reserva
    const { error } = await supabase.from('reservations').insert([{
        user_id: user.id,
        restaurant_id,
        reservation_time,
        number_of_guests,
        status: 'pending',
        reservation_name,
        phone,
        credit_card
    }]);
    if (error) {
        return res.status(500).json({ error: 'Error al reservar: ' + error.message });
    }
    res.json({ success: true });
});

// Ruta para obtener las reservas de un cliente
app.get('/my-reservations', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'No autorizado' });

    const { data: reservas, error } = await supabase
        .from('reservations')
        .select('*, restaurants(name, address)')
        .eq('user_id', user.id)
        .order('reservation_time', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json(reservas);
});

// Ruta para que un restaurante pueda aceptar o denegar una reserva
app.put('/reservations/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar el estado actual de la reserva
    const { data: reserva, error: fetchError } = await supabase
        .from('reservations')
        .select('status')
        .eq('id', id)
        .single();

    if (fetchError || !reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (reserva.status === 'cancelled') {
        return res.status(400).json({ error: 'No se puede cambiar el estado de una reserva cancelada.' });
    }

    if (!["accepted", "denied"].includes(status)) {
        return res.status(400).json({ error: 'Estado no permitido' });
    }

    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Ruta para que un cliente pueda cancelar una reserva
app.put('/reservations/:id/cancel', async (req, res) => {
    const { id } = req.params;

    // Verificar el estado actual de la reserva
    const { data: reserva, error: fetchError } = await supabase
        .from('reservations')
        .select('status')
        .eq('id', id)
        .single();

    if (fetchError || !reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (reserva.status === 'cancelled') {
        return res.status(400).json({ error: 'La reserva ya está cancelada.' });
    }

    // Actualizar el estado a "cancelled"
    const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});