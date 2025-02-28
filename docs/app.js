// Verifica que el SDK de Supabase esté cargado
if (typeof supabase === 'undefined') {
    console.error('Supabase no está cargado');
} else {
    console.log('Supabase está cargado');
}

// Inicializa Supabase
const supabaseUrl = 'https://lvvihdrpnrhghlnejyzp.supabase.co';
const supabaseKey = 'tu_clave_de_supabase'; // Reemplaza con tu clave real
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log('Supabase inicializado:', supabaseClient); // Depuración

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Intentando iniciar sesión con:', email, password); // Depuración

    const { user, error } = await supabaseClient.auth.signIn({ email, password });

    if (error) {
        console.error('Error al iniciar sesión:', error); // Depuración
        alert(error.message);
    } else {
        console.log('Usuario logueado:', user); // Depuración
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }
}

// Verifica si el usuario ya ha iniciado sesión al cargar la página
async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (data.session) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }
}

checkSession();