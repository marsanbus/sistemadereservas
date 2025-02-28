const supabaseUrl = 'https://lvvihdrpnrhghlnejyzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dmloZHJwbnJoZ2hsbmVqeXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3Mzc2NjEsImV4cCI6MjA1NjMxMzY2MX0.l1WggVuxur2JoPiqD4UzNwz9NL3ZFKvU7KlRh0FAWA8';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Intentando iniciar sesión con:', email, password); // Depuración

    const { user, error } = await supabase.auth.signIn({ email, password });

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
    const { data, error } = await supabase.auth.getSession();

    if (data.session) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }
}

checkSession();