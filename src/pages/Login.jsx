import { useId, useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

function Brand() {
  return (
    <span className="brand auth-brand">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span className="brand-name">Reader Challenge</span>
    </span>
  );
}

/** Pantalla centrada reutilizada por el login y los estados de acceso. */
export function AuthScreen({ title, children }) {
  return (
    <main className="auth-screen">
      <div className="auth-card surface">
        <Brand />
        <h1 className="auth-title">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export default function Login() {
  const { actions } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const uid = useId();

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Introduce tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await actions.signIn(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen title="Inicia sesión">
      <p className="auth-text">Entra con la cuenta de participante que os ha creado el administrador.</p>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-email`}>Correo</label>
          <input
            id={`${uid}-email`}
            type="email"
            className={`field-input ${error ? 'is-invalid' : ''}`}
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-pass`}>Contraseña</label>
          <input
            id={`${uid}-pass`}
            type="password"
            className={`field-input ${error ? 'is-invalid' : ''}`}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={error ? `${uid}-err` : undefined}
          />
        </div>
        {error && <p id={`${uid}-err`} className="field-error auth-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          <LogIn size={18} aria-hidden="true" /> {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthScreen>
  );
}
