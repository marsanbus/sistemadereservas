// Verificamos que el SDK de Supabase esté cargado
if (typeof supabase === 'undefined') {
    console.error('Supabase no está cargado');
} else {
    console.log('Supabase está cargado');
}

// Inicializamos Supabase
const supabaseUrl = 'https://lvvihdrpnrhghlnejyzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dmloZHJwbnJoZ2hsbmVqeXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3Mzc2NjEsImV4cCI6MjA1NjMxMzY2MX0.l1WggVuxur2JoPiqD4UzNwz9NL3ZFKvU7KlRh0FAWA8'; // Reemplaza con tu clave real
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase inicializado:', supabaseClient);

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

    // Guarda el token en localStorage
    if (result.session && result.session.access_token) {
        localStorage.setItem('access_token', result.session.access_token);
    } else if (result.access_token) {
        localStorage.setItem('access_token', result.access_token);
    }
    window.location.href = 'index.html';
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
}
// Función donde verificamos si el usuario ya ha iniciado sesión al cargar la página
function checkSession() {
    const token = localStorage.getItem('access_token');
    const currentPage = window.location.pathname.split('/').pop();

    if (token) {
        // Usuario logueado, permite acceso
    } else {
        // No logueado
        if (
            currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'registro_restaurante.html') {
                window.location.href = 'login.html';
        }
    }
}
// Función para registrar un nuevo usuario
async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;
    const surname = document.getElementById('surname').value;
    const alias = document.getElementById('alias').value;

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    const userId = data.user?.id;
    if (userId) {
        // Guardamos el rol
        await supabaseClient.from('profiles').insert([
            { id: userId, email, role: 'cliente' }
        ]);
        // Guardamos los datos personales
        await supabaseClient.from('users').insert([
            { id: userId, email, name, surname, alias }
        ]);
    }

    alert('Registro exitoso.');
    window.location.href = 'login.html';
}

checkSession();