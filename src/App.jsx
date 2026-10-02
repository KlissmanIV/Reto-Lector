import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { ToastProvider } from './context/ToastContext';
import { UiProvider } from './context/UiContext';
import AppShell from './components/layout/AppShell';
import { Skeleton } from './components/common/ui';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Challenge from './pages/Challenge';
import History from './pages/History';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Streak from './pages/Streak';
import Login, { AuthScreen } from './pages/Login';

/** Aplica el tema (light / dark / system) y reacciona a cambios del sistema. */
function useThemeSync(theme) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme;
    };
    apply();
    if (theme !== 'system') return undefined;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function LoadingScreen() {
  return (
    <div className="loading-screen" aria-busy="true" aria-label="Cargando">
      <Skeleton style={{ width: 180, height: 22 }} />
      <Skeleton style={{ width: '100%', height: 220, borderRadius: 16 }} />
      <Skeleton style={{ width: '100%', height: 120, borderRadius: 16 }} />
    </div>
  );
}

function AppRoutes() {
  const { status, settings, actions } = useAppData();
  useThemeSync(settings.theme);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signedOut') return <Login />;
  if (status === 'unconfigured') {
    return (
      <AuthScreen title="Falta configurar la base de datos">
        <p className="auth-text">
          Define las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (en <code>.env</code> o en Vercel) y vuelve a compilar.
        </p>
      </AuthScreen>
    );
  }
  if (status === 'noProfile') {
    return (
      <AuthScreen title="Cuenta sin vincular">
        <p className="auth-text">Tu cuenta existe, pero todavía no está vinculada a un participante. Pide al administrador que la vincule.</p>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => actions.signOut()}>Cerrar sesión</button>
      </AuthScreen>
    );
  }
  if (status === 'error') {
    return (
      <AuthScreen title="No se pudieron cargar los datos">
        <p className="auth-text">Revisa tu conexión e inténtalo de nuevo.</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => actions.reload()}>Reintentar</button>
      </AuthScreen>
    );
  }

  return (
    <UiProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="biblioteca" element={<Library />} />
          <Route path="desafio" element={<Challenge />} />
          <Route path="historial" element={<History />} />
          <Route path="racha" element={<Streak />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="perfil/:userId" element={<Profile />} />
          <Route path="ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </UiProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
