async function loadRestaurants() {
    const { data, error } = await supabaseClient.from('restaurants').select('*');
    if (error) console.error("Error cargando restaurantes:", error);
    else {
        const container = document.getElementById('restaurants-list');
        data.forEach(restaurant => {
            container.innerHTML += `
                <div class="restaurant">
                    <h3>${restaurant.name}</h3>
                    <button onclick="loadTables('${restaurant.id}')">Ver mesas</button>
                </div>`;
        });
    }
}
loadRestaurants();