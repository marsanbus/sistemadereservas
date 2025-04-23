// Solo permitimos el acceso a clientes
if (localStorage.getItem('user_role') === 'restaurante') {
    window.location.href = 'panel_restaurante.html';
}

// Función para registrar un nuevo restaurante
window.registerRestaurant = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('restaurant-name').value;
    const address = document.getElementById('restaurant-address').value;
    const city = document.getElementById('restaurant-city').value;
    const phone = document.getElementById('restaurant-phone').value;

    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/register-restaurant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, address, city, phone })
    });

    const result = await response.json();

    if (!response.ok) {
        mostrarMensaje(result.error || 'Error en el registro');
        return;
    }

    mostrarMensaje('Bienvenido', 'Registro de restaurante exitoso.');
    window.location.href = 'login.html';
}

// Importamos los restaurantes desde Supabase
async function loadRestaurants() {
    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/restaurants');
    const data = await response.json();
    const list = document.getElementById('restaurants-list');
    list.innerHTML = '';
    if (!response.ok) {
        list.innerHTML = '<div class="alert alert-danger">Error cargando restaurantes</div>';
        return;
    }
    if (data.length === 0) {
        list.innerHTML = '<div class="alert alert-info">No hay restaurantes registrados.</div>';
        return;
    }
    data.forEach(r => {
        list.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${r.name}</h5>
                        <p class="card-text">${r.address || ''} ${r.city ? ' - ' + r.city : ''}</p>
                        <p class="card-text">${r.phone ? 'Tel: ' + r.phone : ''}</p>
                        <button class="btn btn-success" onclick="abrirReservaModal('${r.id}', '${r.name}')">Reservar</button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Función para validar la hora de reserva
function validarHoraReserva(fecha) {
    const d = new Date(fecha);
    const hora = d.getHours();
    const minutos = d.getMinutes();
    const minutosValidos = [0, 15, 30, 45];

    if (hora >= 13 && hora <= 15 && minutosValidos.includes(minutos)) return true;
    if (hora >= 20 && hora <= 22 && minutosValidos.includes(minutos)) return true;
    if ((hora === 15 || hora === 22) && minutos === 45) return true;

    return false;
}

// Función para abrir el modal de reserva
window.abrirReservaModal = async function(restauranteId, restauranteNombre) {
    document.getElementById('modal-restaurante-id').value = restauranteId;
    document.getElementById('modal-restaurante-nombre').textContent = restauranteNombre;

    const modal = new bootstrap.Modal(document.getElementById('reservaModal'));
    modal.show();
};

// Lógica para enviar la reserva
document.getElementById('form-reserva').addEventListener('submit', async function(e) {
    e.preventDefault();
    const restauranteId = document.getElementById('modal-restaurante-id').value;
    const nombreReserva = document.getElementById('reserva-nombre').value;
    const dia = document.getElementById('reserva-dia').value;
    const hora = document.getElementById('reserva-hora').value;
    const minutos = document.getElementById('reserva-minutos').value;
    const comensales = parseInt(document.getElementById('reserva-comensales').value, 10);
    const telefono = document.getElementById('reserva-telefono').value;
    const tarjeta = document.getElementById('reserva-tarjeta').value;

    if (!dia || !hora || !minutos) {
        mostrarMensaje('Error', 'Debes seleccionar fecha, hora y minutos.');
        return;
    }

    const fecha = `${dia}T${hora.padStart(2, '0')}:${minutos}:00`;

    // Validación para no permitir reservas en el pasado
    const fechaReserva = new Date(fecha);
    const ahora = new Date();
    if (fechaReserva < ahora) {
        mostrarMensaje('Error', 'No puedes realizar una reserva para una fecha y hora anterior a la actual.');
        return;
    }

    const token = localStorage.getItem('access_token');

    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/reservations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            restaurant_id: restauranteId,
            reservation_name: nombreReserva,
            reservation_time: fecha,
            number_of_guests: comensales,
            phone: telefono,
            credit_card: tarjeta
        })
    });

    const result = await response.json();

    if (!response.ok) {
        mostrarMensaje(result.error || 'Error al reservar');
        return;
    }

    mostrarMensaje('Reserva realizada correctamente');
    const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModal'));
    modal.hide();
});

// Llama a la función para cargar los restaurantes al cargar la página
window.addEventListener('DOMContentLoaded', loadRestaurants);