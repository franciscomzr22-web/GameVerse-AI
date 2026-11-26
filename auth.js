(() => {
  const byId = id => document.getElementById(id);
  const screen = byId('authScreen');
  const app = byId('appShell');
  const form = byId('authForm');
  const feedback = byId('authFeedback');
  if (!screen || !app) return;

  const config = window.GAMEVERSE_FIREBASE_CONFIG || {};
  const configured = Boolean(config.apiKey && config.apiKey !== 'PEGAR_API_KEY' && config.projectId && config.projectId !== 'TU_PROJECT_ID' && config.appId && config.appId !== 'TU_APP_ID');

  let auth = null;
  let mode = 'login';

  function message(text, type='') {
    feedback.textContent = text;
    feedback.className = 'auth-feedback ' + type;
  }
  function setMode(next) {
    mode = next;
    byId('loginTab').classList.toggle('active', mode === 'login');
    byId('registerTab').classList.toggle('active', mode === 'register');
    byId('authTitle').textContent = mode === 'login' ? 'Qué bueno verte de nuevo' : 'Creá tu cuenta';
    byId('authSubtitle').textContent = mode === 'login' ? 'Ingresá a tu espacio creativo.' : 'Unite a la comunidad de creadores.';
    byId('authSubmit').innerHTML = mode === 'login' ? 'Iniciar sesión <span>→</span>' : 'Crear cuenta <span>→</span>';
    byId('forgotPassword').hidden = mode !== 'login';
    byId('authPassword').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  }
  function showApp(user) {
    screen.hidden = true;
    app.hidden = false;
    byId('accountName').textContent = user.displayName || (user.email || 'Creador').split('@')[0];
    byId('accountEmail').textContent = user.email || 'Sesión iniciada';
    const avatar = document.querySelector('.user-avatar');
    if (avatar) avatar.textContent = (user.displayName || user.email || 'G').charAt(0).toUpperCase();
  }
  function showLogin() {
    app.hidden = true;
    screen.hidden = false;
  }

  byId('loginTab').addEventListener('click', () => setMode('login'));
  byId('registerTab').addEventListener('click', () => setMode('register'));

  if (!configured || !window.firebase) {
    showLogin();
    message('Falta conectar Firebase. Seguí la guía de configuración en README.md; no ingreses tu contraseña hasta que esté configurado.', 'error');
    form.addEventListener('submit', e => { e.preventDefault(); message('Primero hay que configurar Firebase Authentication en este proyecto.', 'error'); });
    byId('googleAuth').addEventListener('click', () => message('Primero hay que configurar Firebase y activar el acceso con Google.', 'error'));
    byId('forgotPassword').addEventListener('click', () => message('Primero hay que configurar Firebase Authentication.', 'error'));
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(config);
    auth = firebase.auth();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    auth.onAuthStateChanged(user => user ? showApp(user) : showLogin());
  } catch (err) {
    showLogin();
    message('No se pudo iniciar Firebase: ' + err.message, 'error');
    return;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = byId('authEmail').value.trim();
    const password = byId('authPassword').value;
    const submit = byId('authSubmit');
    submit.disabled = true;
    try {
      if (mode === 'register') await auth.createUserWithEmailAndPassword(email, password);
      else await auth.signInWithEmailAndPassword(email, password);
      message('¡Sesión iniciada!', 'success');
    } catch (err) {
      const errors = {
        'auth/email-already-in-use':'Ese correo ya tiene una cuenta.',
        'auth/invalid-email':'El correo no parece válido.',
        'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found':'No encontramos una cuenta con ese correo.',
        'auth/wrong-password':'La contraseña no es correcta.',
        'auth/invalid-credential':'El correo o la contraseña no son correctos.',
        'auth/operation-not-allowed':'Activá este método de acceso en Firebase Console.'
      };
      message(errors[err.code] || 'No se pudo iniciar sesión: ' + err.message, 'error');
    } finally { submit.disabled = false; }
  });

  byId('googleAuth').addEventListener('click', async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await auth.signInWithPopup(provider);
    } catch (err) {
      message(err.code === 'auth/operation-not-allowed' ? 'Activá Google en Firebase Authentication.' : 'No se pudo entrar con Google: ' + err.message, 'error');
    }
  });

  byId('forgotPassword').addEventListener('click', async () => {
    const email = byId('authEmail').value.trim();
    if (!email) return message('Escribí tu correo primero y después tocá recuperar contraseña.', 'error');
    try {
      await auth.sendPasswordResetEmail(email);
      message('Si existe una cuenta con ese correo, recibirás un enlace para recuperar la contraseña.', 'success');
    } catch (err) {
      message('No se pudo enviar el correo de recuperación. Revisá el correo ingresado.', 'error');
    }
  });

  byId('signOutBtn').addEventListener('click', async () => {
    try { await auth.signOut(); } catch (err) { console.error(err); }
  });
  setMode('login');
})();