import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const googleLogin = async () => {
    setMsg('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }, // lets you pick which Google account
      },
    });
    if (error) notify.error(error.message);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const creds = { email, password };
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(creds)
        : await supabase.auth.signUp(creds);
    setBusy(false);
    if (error) notify.error(error.message);
else if (mode === 'signup') notify.success('Account created. If email confirmation is on, check your inbox, then sign in.');
  };

  return (
    <div className="card login">
      <h2>Daybook</h2>
      <p className="muted">Sign in or create an account</p>

      <button className="google-btn" onClick={googleLogin}>
        <GoogleIcon /> Continue with Google
      </button>

      <div className="divider"><span>or use email</span></div>

      <form onSubmit={submit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 characters)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="primary" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      {msg && <p className="error">{msg}</p>}
      <button className="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'No account? Sign up' : 'Have an account? Sign in'}
      </button>
    </div>
  );
}