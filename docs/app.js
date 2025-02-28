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
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error('Error al cerrar sesión:', error); // Depuración
        alert(error.message);
    } else {
        console.log('Sesión cerrada correctamente'); // Depuración
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
}

// Verifica si el usuario ya ha iniciado sesión al cargar la página
async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (data.session) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    } else {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('content').style.display = 'none';
    }
}

checkSession();