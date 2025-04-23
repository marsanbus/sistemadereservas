let restauranteId = null;

async function loadPanel() {
    // Recuperamos el token y el rol
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (role !== 'restaurante') {
        window.location.href = 'restaurantes.html';
        return;
    }

    // Llamamos al backend para obtener el restaurante del usuario autenticado
    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/my-restaurant', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const result = await response.json();
    if (!response.ok || !result || !result.id) {
        mostrarMensaje('Error', 'No tienes restaurante asociado. Contacta con el administrador.');
        return;
    }
    restauranteId = result.id;
    document.getElementById('welcome').textContent = `Bienvenido, ${result.name || ''}`;
    document.getElementById('total-tables').value = result.total_tables || '';
    document.getElementById('total-capacity').value = result.total_capacity || '';
}

// Guardamos los cambios de capacidad
document.getElementById('edit-capacity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!restauranteId) return;
    const total_tables = parseInt(document.getElementById('total-tables').value, 10);
    const total_capacity = parseInt(document.getElementById('total-capacity').value, 10);

    if (isNaN(total_tables) || isNaN(total_capacity)) {
        mostrarMensaje('Error', 'Introduce valores numéricos válidos.');
        return;
    }

    const token = localStorage.getItem('access_token');
    const response = await fetch(`https://sistemadereservas-d1t5.onrender.com/restaurants/${restauranteId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ total_tables, total_capacity })
    });

    const result = await response.json();

    if (!response.ok) {
        mostrarMensaje(result.error || 'Error al guardar');
    } else {
        mostrarMensaje('Información', 'Datos actualizados');
    }
});

// Mostramos las reservas recibidas
async function loadReservations() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`https://sistemadereservas-d1t5.onrender.com/restaurants/${restauranteId}/reservations`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const reservations = await response.json();
    const list = document.getElementById('reservations-list');
    list.innerHTML = '';
    if (reservations && reservations.length > 0) {
        reservations.forEach(r => {
            let acciones = '';
            if (r.status === 'pending') {
                acciones = `
                        <button class="btn btn-success btn-sm me-2" onclick="cambiarEstadoReserva('${r.id}', 'accepted')">Aceptar</button>
                        <button class="btn btn-danger btn-sm" onclick="cambiarEstadoReserva('${r.id}', 'denied')">Denegar</button>
                    `;
            } else if (r.status === 'accepted') {
                acciones = `<span class="badge bg-success">Aceptada</span>`;
            } else if (r.status === 'denied') {
                acciones = `<span class="badge bg-danger">Denegada</span>`;
            } else if (r.status === 'cancelled') {
                acciones = `<span class="badge bg-secondary">Cancelada</span>`;
            }
            list.innerHTML += `<li class="list-group-item">
                    <strong>${r.reservation_time.replace('T', ' ').substring(0, 16)}</strong> - ${r.number_of_guests} comensales<br>
                    Nombre reserva: ${r.reservation_name || ''}<br>
                    Teléfono: ${r.phone || ''}<br>
                    Tarjeta: ${r.credit_card || ''}<br>
                    Estado: ${acciones}
                </li>`;
        });
    } else {
        list.innerHTML = '<li class="list-group-item">No hay reservas futuras.</li>';
    }
}

// Cambiamos el estado de la reserva
window.cambiarEstadoReserva = async function (id, status) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`https://sistemadereservas-d1t5.onrender.com/reservations/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok) {
        mostrarMensaje(result.error || 'Error al actualizar el estado');
        return;
    }
    await loadReservations();
};

async function mainPanel() {
    await loadPanel();
    await loadReservations();
    setInterval(loadReservations, 5000);
}
mainPanel();