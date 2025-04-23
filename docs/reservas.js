// Función para cargar y mostrar las reservas del usuario autenticado
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

    // Recorremos las reservas y mostramos su información y acciones según el estado
    reservas.forEach(r => {
        let acciones = '';
        let estado = '';
        if (r.status === 'pending') {
            estado = `<span class="badge bg-warning text-dark">Pendiente</span>`;
            // Botón cancelar más separado
            acciones = `<button class="btn btn-danger btn-sm ms-3" onclick="cancelarReserva('${r.id}')">Cancelar</button>`;
        } else if (r.status === 'accepted') {
            estado = `<span class="badge bg-success">Aceptada</span>`;
            acciones = `<button class="btn btn-danger btn-sm ms-3" onclick="cancelarReserva('${r.id}')">Cancelar</button>`;
        } else if (r.status === 'denied') {
            estado = `<span class="badge bg-danger">Denegada</span>`;
        } else if (r.status === 'cancelled') {
            estado = `<span class="badge bg-secondary">Cancelada</span>`;
        }
        list.innerHTML += `<li class="list-group-item">
            <strong>${r.restaurants?.name || ''}</strong> - ${r.restaurants?.address || ''}<br>
            Fecha: ${r.reservation_time.replace('T', ' ').substring(0, 16)}<br>
            Comensales: ${r.number_of_guests}<br>
            Estado: ${estado}${acciones}
        </li>`;
    });
}

// Función para cancelar una reserva
window.cancelarReserva = async function(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`https://sistemadereservas-d1t5.onrender.com/reservations/${id}/cancel`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const result = await response.json();
    if (!response.ok) {
        alert(result.error || 'Error al cancelar la reserva');
        return;
    }
    await loadMisReservas();
};

loadMisReservas();