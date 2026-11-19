import { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="auth-page">
      <header className="auth-brand">
        <img src="/daybook-mark.svg" alt="" />
        <span>daybook</span>
      </header>

      <div className="auth-content">
        <section className="auth-story" aria-label="About Daybook">
          <span className="auth-eyebrow"><span className="eyebrow-dot" /> YOUR DAYS, WITH INTENTION</span>
          <h1>A little more focus.<br /><span>A lot more you.</span></h1>
          <p className="auth-description">
            Bring your plans, priorities, and progress together in one calm place.
            Make space for what matters today.
          </p>

          <div className="preview-card" aria-hidden="true">
            <div className="preview-head">
              <div>
                <span className="preview-caption">YOUR DAYBOOK</span>
                <strong>This week</strong>
              </div>
              <span className="preview-date">NOV 16 — 22</span>
            </div>
            <div className="preview-days">
              {[
                ['M', '16', false],
                ['T', '17', false],
                ['W', '18', true],
                ['T', '19', false],
                ['F', '20', false],
              ].map(([day, date, active]) => (
                <div className={`preview-day ${active ? 'is-active' : ''}`} key={`${day}-${date}`}>
                  <span>{day}</span><b>{date}</b>
                  {active && <i />}
                </div>
              ))}
            </div>
            <div className="preview-task">
              <span className="preview-task-icon"><Check size={15} strokeWidth={2.5} /></span>
              <span><b>Make room for your priorities</b><small>A plan that feels like yours</small></span>
              <span className="preview-task-time">TODAY</span>
            </div>
          </div>

          <div className="auth-benefits">
            <span><CalendarDays size={16} /> Your schedule</span>
            <span><Check size={16} /> Your progress</span>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="auth-form-kicker">WELCOME TO DAYBOOK</span>
            <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'signin' ? 'Sign in to pick up where you left off.' : 'A more thoughtful day starts here.'}</p>
          </div>

          <button className="google-btn" type="button" onClick={googleLogin}>
            <GoogleIcon /> Continue with Google
          </button>

          <div className="divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={submit}>
            <label htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-password-label">
              <label htmlFor="auth-password">Password</label>
              <span>{mode === 'signup' ? 'At least 6 characters' : ''}</span>
            </div>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="password-visibility"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="auth-submit" disabled={busy}>
              <span>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</span>
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          {msg && <p className="error">{msg}</p>}
          <p className="auth-switch">
            {mode === 'signin' ? 'New to Daybook?' : 'Already have an account?'}
            <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
          <p className="auth-privacy">A calmer place for your plans and progress.</p>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© {new Date().getFullYear()} Daybook</span>
        <span>Make today count, your way.</span>
      </footer>
    </main>
  );
}