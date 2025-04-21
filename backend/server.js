const express = require('express');
const app = express();
const supabase = require('./supabase'); // Configuración de Supabase
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return res.status(401).json({ error: error.message });
    }
    const userId = data.user?.id;
    let role = null;
    if (userId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        role = profile?.role || null;
    }
    res.json({ ...data, role });
});

app.post('/register', async (req, res) => {
    const { email, password, name, surname, alias } = req.body;
    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    // 2. Guardar perfil y datos personales
    if (userId) {
        await supabase.from('profiles').insert([{ id: userId, email, role: 'cliente' }]);
        await supabase.from('users').insert([{ id: userId, email, name, surname, alias }]);
    }
    res.json({ success: true });
});

app.post('/register-restaurant', async (req, res) => {
    const { email, password, name, address, city, phone } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;
    if (userId) {
        await supabase.from('profiles').insert([{ id: userId, email, role: 'restaurante' }]);
        await supabase.from('restaurants').insert([{ name, address, city, phone, email, owner_id: userId }]);
    }
    res.json({ success: true });
});

// Ruta para obtener todos los restaurantes
app.get('/restaurants', async (req, res) => {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error) return res.status(500).json({ error });
    res.json(data);
});

app.put('/restaurants/:id', async (req, res) => {
    const { total_tables, total_capacity } = req.body;
    const { id } = req.params;
    const { error } = await supabase
        .from('restaurants')
        .update({ total_tables, total_capacity })
        .eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

app.get('/my-restaurant', async (req, res) => {
    // Extrae el token del header Authorization
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    // Obtén el usuario desde el token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'No autorizado' });

    // Busca el restaurante asociado a ese usuario
    const { data: restaurantes, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id);

    if (error || !restaurantes || restaurantes.length === 0) {
        return res.status(404).json({ error: 'No tienes restaurante asociado' });
    }
    res.json(restaurantes[0]);
});

app.get('/restaurants/:id/reservations', async (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('reservations')
        .select('*, users(name, email)')
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

    // 1. Obtener datos del restaurante
    const { data: restaurante } = await supabase
        .from('restaurants')
        .select('total_tables, total_capacity')
        .eq('id', restaurant_id)
        .single();

    if (!restaurante) {
        return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    // 2. Contar reservas para ese restaurante, fecha y hora
    const { data: reservas } = await supabase
        .from('reservations')
        .select('id, number_of_guests')
        .eq('restaurant_id', restaurant_id)
        .eq('reservation_time', reservation_time);

    const mesasReservadas = reservas.length;
    const comensalesReservados = reservas.reduce((sum, r) => sum + r.number_of_guests, 0);

    if (mesasReservadas >= restaurante.total_tables) {
        return res.status(400).json({ error: 'No hay mesas disponibles para esa fecha y hora.' });
    }
    if ((comensalesReservados + number_of_guests) > restaurante.total_capacity) {
        return res.status(400).json({ error: 'No hay suficiente capacidad para esa cantidad de comensales en ese turno.' });
    }

    // 3. Insertar reserva
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});