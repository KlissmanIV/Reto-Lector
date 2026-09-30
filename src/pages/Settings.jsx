import { useState } from 'react';
import { LogOut, Monitor, Moon, Sun, Upload } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import { useToast } from '../context/ToastContext';
import { Avatar, PageHeader, Segmented } from '../components/common/ui';
import { hasLegacyData } from '../services/storageService';

const THEMES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

function Row({ title, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-text">
        <h3 className="settings-title">{title}</h3>
        {desc && <p className="settings-desc">{desc}</p>}
      </div>
      <div className="settings-control">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, currentUser, email, actions } = useAppData();
  const { confirm } = useUi();
  const { toast } = useToast();
  const [legacy, setLegacy] = useState(hasLegacyData);
  const [importing, setImporting] = useState(false);

  const logout = async () => {
    const ok = await confirm({ title: 'Cerrar sesión', message: 'Tendrás que volver a entrar con tu correo y contraseña.', confirmLabel: 'Cerrar sesión' });
    if (ok) await actions.signOut();
  };

  const importLocal = async () => {
    const ok = await confirm({
      title: 'Subir datos de este navegador',
      message: 'Se subirán tus libros y tu actividad guardados en este dispositivo. Lo que ya exista en la base de datos no se duplica.',
      confirmLabel: 'Subir datos',
    });
    if (!ok) return;
    setImporting(true);
    try {
      const count = await actions.importLegacy();
      toast(count ? `Datos subidos: ${count} registros nuevos` : 'Todo estaba ya sincronizado');
      setLegacy(false);
    } catch (err) {
      toast(err.message, { tone: 'error' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="settings-page">
      <PageHeader title="Ajustes" />

      <section className="section" aria-labelledby="s-appearance">
        <h2 id="s-appearance" className="section-title">Apariencia</h2>
        <div className="surface">
          <Row title="Tema" desc="Se guarda en este dispositivo. Sistema sigue la configuración del dispositivo.">
            <Segmented label="Tema" options={THEMES} value={settings.theme} onChange={(theme) => actions.updateSettings({ theme })} size="sm" />
          </Row>
        </div>
      </section>

      <section className="section" aria-labelledby="s-account">
        <h2 id="s-account" className="section-title">Cuenta</h2>
        <div className="surface">
          <Row
            title={
              <span className="d-inline-flex align-items-center gap-2">
                {currentUser && <Avatar user={currentUser} size={28} />} {currentUser?.name}
              </span>
            }
            desc={<span className="settings-email">{email}</span>}
          >
            <button type="button" className="btn btn-secondary" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> Cerrar sesión
            </button>
          </Row>
        </div>
      </section>

      {legacy && (
        <section className="section" aria-labelledby="s-data">
          <h2 id="s-data" className="section-title">Datos</h2>
          <div className="surface">
            <Row title="Datos guardados en este navegador" desc="Encontramos datos de la versión anterior de la app. Súbelos una vez para que se vean en todos tus dispositivos.">
              <button type="button" className="btn btn-primary" onClick={importLocal} disabled={importing}>
                <Upload size={16} aria-hidden="true" /> {importing ? 'Subiendo…' : 'Subir datos'}
              </button>
            </Row>
          </div>
        </section>
      )}

      <p className="settings-foot">Los datos se sincronizan entre dispositivos. Al volver a la app se cargan los últimos cambios.</p>
    </div>
  );
}
