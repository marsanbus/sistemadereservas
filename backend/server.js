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

// Ruta para crear una reserva
app.post('/reservations', async (req, res) => {
    const { user_id, table_id, reservation_time, number_of_guests } = req.body;
    const { data, error } = await supabase
        .from('reservations')
        .insert([{ user_id, table_id, reservation_time, number_of_guests }]);
    if (error) return res.status(500).json({ error });
    res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});