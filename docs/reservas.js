document.getElementById('reservation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error } = await supabaseClient.from('reservations').insert([{
        user_id: user.id,
        table_id: document.getElementById('table-id').value,
        reservation_time: document.getElementById('reservation-time').value,
        status: 'confirmed'
    }]);
    if (error) alert("Error al reservar: " + error.message);
    else alert("¡Reserva confirmada!");
});