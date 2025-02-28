document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('http://localhost:3000/restaurants');
    const restaurants = await response.json();

    const container = document.getElementById('restaurants');
    restaurants.forEach(restaurant => {
        const div = document.createElement('div');
        div.className = 'restaurant';
        div.innerHTML = `
            <h2>${restaurant.name}</h2>
            <p>${restaurant.address}</p>
            <button onclick="reservar(${restaurant.id})">Reservar Mesa</button>
        `;
        container.appendChild(div);
    });
});

async function reservar(restaurantId) {
    // Lógica para reservar una mesa
    alert(`Reservando en el restaurante con ID: ${restaurantId}`);
}