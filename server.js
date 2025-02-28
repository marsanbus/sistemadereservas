const express = require('express');
const app = express();
const supabase = require('./supabase'); // Configuración de Supabase
const cors = require('cors');

app.use(cors());
app.use(express.json());

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