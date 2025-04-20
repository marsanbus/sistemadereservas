// Función para registrar un nuevo restaurante
async function registerRestaurant() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('restaurant-name').value;
    const address = document.getElementById('restaurant-address').value;
    const city = document.getElementById('restaurant-city').value;
    const phone = document.getElementById('restaurant-phone').value;

    // 1. Crear usuario en Auth
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        alert(error.message);
        return;
    }

    const userId = data.user?.id;
    if (userId) {
// 2. Guardar perfil con rol restaurante
const { error: profileError } = await supabaseClient.from('profiles').insert([
    { id: userId, email, role: 'restaurante' }
]);
if (profileError) {
    alert('Error guardando perfil: ' + profileError.message);
    return;
}

// 3. Guardar datos del restaurante (AQUÍ AÑADES owner_id)
const { error: restError } = await supabaseClient.from('restaurants').insert([
    { name, address, city, phone, email, owner_id: userId }
]);
if (restError) {
    alert('Error guardando restaurante: ' + restError.message);
    return;
}
}

    alert('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
    window.location.href = 'login.html';
}

// Importamos los restaurantes desde Supabase
async function loadRestaurants() {
    const { data, error } = await supabaseClient.from('restaurants').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('restaurants-list');
    list.innerHTML = '';
    if (error) {
        list.innerHTML = '<div class="alert alert-danger">Error cargando restaurantes</div>';
        return;
    }
    if (data.length === 0) {
        list.innerHTML = '<div class="alert alert-info">No hay restaurantes registrados.</div>';
        return;
    }
    data.forEach(r => {
        document.getElementById('restaurants-list').innerHTML += `
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
    const fecha = document.getElementById('reserva-fecha').value;
    const comensales = parseInt(document.getElementById('reserva-comensales').value, 10);
    const telefono = document.getElementById('reserva-telefono').value;
    const tarjeta = document.getElementById('reserva-tarjeta').value;

    // Comprobar disponibilidad
    // 1. Obtener datos del restaurante
    const { data: restaurante } = await supabaseClient.from('restaurants').select('total_tables, total_capacity').eq('id', restauranteId).single();
    if (!restaurante) {
        alert('Restaurante no encontrado');
        return;
    }

    // 2. Contar reservas para ese restaurante, fecha y hora
    const { data: reservas } = await supabaseClient
        .from('reservations')
        .select('id, number_of_guests')
        .eq('restaurant_id', restauranteId)
        .eq('reservation_time', fecha);

    const mesasReservadas = reservas.length;
    const comensalesReservados = reservas.reduce((sum, r) => sum + r.number_of_guests, 0);

    if (mesasReservadas >= restaurante.total_tables) {
        alert('No hay mesas disponibles para esa fecha y hora.');
        return;
    }
    if ((comensalesReservados + comensales) > restaurante.total_capacity) {
        alert('No hay suficiente capacidad para esa cantidad de comensales en ese turno.');
        return;
    }

    // 3. Insertar reserva
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { error } = await supabaseClient.from('reservations').insert([{
        user_id: user.id,
        restaurant_id: restauranteId,
        reservation_time: fecha,
        number_of_guests: comensales,
        status: 'pending',
        reservation_name: nombreReserva,
        phone: telefono,
        credit_card: tarjeta
    }]);
    if (error) {
        alert('Error al reservar: ' + error.message);
    } else {
        alert('Reserva realizada correctamente');
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservaModal'));
        modal.hide();
    }
});

// Llama a la función para cargar los restaurantes al cargar la página
window.addEventListener('DOMContentLoaded', loadRestaurants);