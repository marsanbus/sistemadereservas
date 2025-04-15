// Verifica que el SDK de Supabase esté cargado
if (typeof supabase === 'undefined') {
    console.error('Supabase no está cargado');
} else {
    console.log('Supabase está cargado');
}

// Inicializa Supabase
const supabaseUrl = 'https://lvvihdrpnrhghlnejyzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dmloZHJwbnJoZ2hsbmVqeXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3Mzc2NjEsImV4cCI6MjA1NjMxMzY2MX0.l1WggVuxur2JoPiqD4UzNwz9NL3ZFKvU7KlRh0FAWA8'; // Reemplaza con tu clave real
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase inicializado:', supabaseClient); // Depuración

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Intentando iniciar sesión con:', email, password); // Depuración

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Error al iniciar sesión:', error); // Depuración
        alert(error.message);
    } else {
        console.log('Usuario logueado:', data.user); // Depuración

        // Redirige a index.html después de un inicio de sesión exitoso
        window.location.href = 'index.html';
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Error al cerrar sesión:', error); // Depuración
        alert(error.message);
    } else {
        console.log('Sesión cerrada correctamente'); // Depuración

        // Redirige a login.html después de cerrar sesión
        window.location.href = 'login.html';
    }
}

// Verifica si el usuario ya ha iniciado sesión al cargar la página
async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (data.session) {
        // Permitir al usuario permanecer en cualquier página válida
        const currentPage = window.location.pathname.split('/').pop(); // Obtiene el nombre del archivo actual
        const allowedPages = ['index.html', 'reservas.html', 'auth/login.html']; // Lista de páginas permitidas

        if (!allowedPages.includes(currentPage)) {
            // Redirige a index.html si la página actual no está permitida
            window.location.href = 'index.html';
        }
    } else {
        // Redirige a login.html si el usuario no está logueado
        if (!window.location.href.includes('auth/login.html')) {
            window.location.href = 'auth/login.html';
        }
    }
}

checkSession();