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

    // Verifica que el email y la contraseña no estén vacíos
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    // Verifica si hubo un error al iniciar sesión
    if (error) {
        alert(error.message);
    } else {
        // Si no hubo errores de login, redirigimos a la página correspondiente según el rol
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();

        if (profile && profile.role === 'restaurante') {
            window.location.href = 'panel_restaurante.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

// Función para cerrar sesión
async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
    } else {
        // Si no hubo errores de logout, redirigimos a login.html después de cerrar sesión
        window.location.href = 'login.html';
    }
}

// Función donde verificamos si el usuario ya ha iniciado sesión al cargar la página
async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (data.session) {
        const currentPage = window.location.pathname.split('/').pop();
        const allowedPages = ['index.html', 'reservas.html', 'login.html', 'register.html', 'restaurantes.html', 'registro_restaurante.html', 'panel_restaurante.html'];
        if (!allowedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    } else {
        const currentPage = window.location.pathname.split('/').pop();
        // Permitir estar en login.html, register.html y registro_restaurante.html si no está logueado
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