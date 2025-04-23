// Función para iniciar sesión
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.error || 'Error al iniciar sesión');
        return;
    }

    // Guardamos el token en localStorage
    if (result.session && result.session.access_token) {
        localStorage.setItem('access_token', result.session.access_token);
    } else if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
    }
    if (result.role) {
        localStorage.setItem('user_role', result.role);
    }
    window.location.href = (result.role === 'restaurante') ? 'panel_restaurante.html' : 'restaurantes.html';
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    window.location.href = 'login.html';
}

// Función donde verificamos si el usuario ya ha iniciado sesión al cargar la página
function checkSession() {
    const token = localStorage.getItem('access_token');
    const currentPage = window.location.pathname.split('/').pop();

    if (!token && currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'registro_restaurante.html') {
        window.location.href = 'login.html';
    }
}

// Función para registrar un nuevo usuario
async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const alias = document.getElementById('alias').value;

    const response = await fetch('https://sistemadereservas-d1t5.onrender.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, surname, alias })
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.error || 'Error en el registro');
        return;
    }

    alert('Registro exitoso.');
    window.location.href = 'login.html';
}

checkSession();