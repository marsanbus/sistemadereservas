// Mostrar las reservas del usuario logueado
async function loadMisReservas() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    // Trae reservas futuras y pasadas, ordenadas por fecha
    const { data: reservas, error } = await supabaseClient
        .from('reservations')
        .select('*, restaurants(name, address)')
        .eq('user_id', user.id)
        .order('reservation_time', { ascending: true });

    const list = document.getElementById('mis-reservas-list');
    list.innerHTML = '';
    if (error) {
        list.innerHTML = '<li class="list-group-item text-danger">Error cargando reservas</li>';
        return;
    }
    if (!reservas || reservas.length === 0) {
        list.innerHTML = '<li class="list-group-item">No tienes reservas.</li>';
        return;
    }
    reservas.forEach(r => {
        list.innerHTML += `<li class="list-group-item">
            <strong>${r.restaurants?.name || ''}</strong> - ${r.restaurants?.address || ''}<br>
            Fecha: ${r.reservation_time.replace('T', ' ').substring(0, 16)}<br>
            Comensales: ${r.number_of_guests}<br>
            Estado: ${r.status}
        </li>`;
    });
}

loadMisReservas();