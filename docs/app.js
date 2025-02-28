const supabaseUrl = 'https://lvvihdrpnrhghlnejyzp.supabase.co';
const supabaseKey = 'tu_clave_de_supabase';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { user, error } = await supabase.auth.signIn({ email, password });

    if (error) {
        alert(error.message);
    } else {
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