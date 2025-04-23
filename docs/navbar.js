// Lógica para mostrar el navbar
window.addEventListener('DOMContentLoaded', async () => {
    const navbarDiv = document.getElementById('navbar');
    if (navbarDiv) {
        const navbar = await fetch('navbar.html').then(res => res.text());
        navbarDiv.innerHTML = navbar;
    }
});