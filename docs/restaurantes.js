// Función para mostrar restaurantes
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
        list.innerHTML += `
            <div class="card mb-2">
                <div class="card-body">
                    <h5 class="card-title">${r.name}</h5>
                    <p class="card-text">${r.address || ''} ${r.city ? ' - ' + r.city : ''}</p>
                    <p class="card-text">${r.phone ? 'Tel: ' + r.phone : ''}</p>
                </div>
            </div>
        `;
    });
}

// Cargar restaurantes al iniciar
loadRestaurants();