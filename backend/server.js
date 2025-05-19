const express = require('express');
const app = express();
const supabase = require('./supabase');
const cors = require('cors');

app.use(cors());
app.use(express.json());

function traducirErrores(error) {
    let mensajeError = error.message;

    // Traducción de errores comunes
    switch (mensajeError) {
        case 'User already registered':
            mensajeError = 'El usuario ya está registrado.';
            break;
        case 'Password should be at least 6 characters':
            mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
            break;
        case 'Invalid email':
            mensajeError = 'El correo electrónico no es válido.';
            break;
        case 'Invalid login credentials':
            mensajeError = 'Credenciales de inicio de sesión inválidas.';
            break;
        case 'Foreign key violation':
            mensajeError = 'Error de clave foránea. Verifica los datos enviados.';
            break;
        case 'Invalid input syntax for type timestamp':
            mensajeError = 'El formato de fecha/hora no es válido.';
            break;
        case 'Row not found':
            mensajeError = 'No se encontró el registro solicitado.';
            break;
        case 'Network error':
            mensajeError = 'Error de red. Por favor, inténtalo de nuevo más tarde.';
            break;
        case 'Unexpected error occurred':
            mensajeError = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.';
            break;
        default:
            mensajeError = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    }
    return mensajeError;
}

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

    const { data: clienteExistente } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .single();

    const { data: restauranteExistente } = await supabase
        .from('restaurants')
        .select('id')
        .eq('email', email)
        .single();

    const { data: aliasExistente } = await supabase
        .from('clients')
        .select('id')
        .eq('alias', alias)
        .single();

    if (clienteExistente || restauranteExistente) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    if (aliasExistente) {
        return res.status(400).json({ error: 'El alias ya está en uso. Por favor, elige otro.' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        return res.status(400).json({ error: traducirErrores(error) });
    }

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

    // Validación de números positivos
    if (total_tables <= 0 || total_capacity <= 0) {
        return res.status(400).json({ error: 'El número de mesas y la capacidad total deben ser mayores a 0.' });
    }

    // Validación del formato del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    // Validación del número de teléfono
    const telefonoRegex = /^[0-9]{9,15}$/;
    if (!telefonoRegex.test(phone)) {
        return res.status(400).json({ error: 'El número de teléfono no es válido.' });
    }

    const { data: clienteExistente } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .single();

    const { data: restauranteExistente } = await supabase
        .from('restaurants')
        .select('id')
        .eq('email', email)
        .single();

    if (clienteExistente || restauranteExistente) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: traducirErrores(error) });

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
        return res.status(401).json({ error: traducirErrores(error) });
    }

    const userId = data.user?.id;
    let role = null;
    if (userId) {
        const { data: client } = await supabase.from('clients').select('role').eq('id', userId).single();
        if (client) {
            role = client.role;
        } else {
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

    // Verificamos si el restaurante existe
    const { data: restaurante, error: fetchError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', id)
        .single();

    if (fetchError || !restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado.' });
    }

    // Actualizamos los datos del restaurante
    const { error } = await supabase
        .from('restaurants')
        .update({ total_tables, total_capacity })
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Ruta para obtener los datos del restaurante logueado
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

    // Verificamos si el restaurante existe
    const { data: restaurante, error: fetchError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', id)
        .single();

    if (fetchError || !restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado.' });
    }

    // Obtenemos las reservas del restaurante para el turno actual
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

    if (userError || !user) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const {
        restaurant_id,
        reservation_name,
        reservation_time,
        number_of_guests,
        phone,
        credit_card
    } = req.body;

    try {
        // Verificamos si el restaurante existe y obtenemos su capacidad
        const { data: restaurante, error: restauranteError } = await supabase
            .from('restaurants')
            .select('total_capacity')
            .eq('id', restaurant_id)
            .single();

        if (restauranteError || !restaurante) {
            return res.status(404).json({ error: 'Restaurante no encontrado.' });
        }

        // Validamos si la capacidad es suficiente
        if (number_of_guests > restaurante.total_capacity) {
            return res.status(400).json({ error: 'No hay suficiente capacidad para esa cantidad de comensales.' });
        }

        // Verificamos si hay mesas disponibles para el turno solicitado
        const { data: reservasExistentes, error: reservasError } = await supabase
            .from('reservations')
            .select('id, number_of_guests, status')
            .eq('restaurant_id', restaurant_id)
            .eq('reservation_time', reservation_time)
            .in('status', ['pending', 'accepted']);

        if (reservasError) {
            return res.status(400).json({ error: 'Error al verificar la disponibilidad de mesas.' });
        }

        const totalComensalesReservados = reservasExistentes.reduce((total, r) => total + r.number_of_guests, 0);
        if (totalComensalesReservados + number_of_guests > restaurante.total_capacity) {
            return res.status(400).json({ error: 'No hay suficiente capacidad para ese turno.' });
        }

        // Insertamos la reserva
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
            throw error;
        }

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: traducirErrores(error) });
    }
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

    // Verificamos el estado actual de la reserva
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

    // Verificamos el estado actual de la reserva
    const { data: reserva, error: reservaError } = await supabase
        .from('reservations')
        .select('user_id')
        .eq('id', id)
        .single();

    if (reservaError || !reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada.' });
    }

    if (reserva.status === 'cancelled') {
        return res.status(400).json({ error: 'La reserva ya está cancelada.' });
    }

    // Actualizamos el estado a "cancelled"
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