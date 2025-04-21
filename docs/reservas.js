async function loadMisReservas() {
    const token = localStorage.getItem('access_token');
    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/my-reservations', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const reservas = await response.json();

    const list = document.getElementById('mis-reservas-list');
    list.innerHTML = '';
    if (!response.ok) {
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