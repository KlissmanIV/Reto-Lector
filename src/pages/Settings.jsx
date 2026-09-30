import { Eraser, Monitor, Moon, RotateCcw, Sun } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useUi } from '../context/UiContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Segmented } from '../components/common/ui';

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
  const { settings, users, actions } = useAppData();
  const { confirm } = useUi();
  const { toast } = useToast();

  const reset = async () => {
    const ok = await confirm({
      title: 'Restaurar datos iniciales',
      message: 'Se reemplazarán libros, desafíos e historial por los datos iniciales de la competencia. Tus ajustes se conservan.',
      confirmLabel: 'Restaurar',
      tone: 'danger',
    });
    if (!ok) return;
    await actions.resetDemo();
    toast('Datos iniciales restaurados');
  };

  const clear = async () => {
    const ok = await confirm({
      title: 'Empezar desde cero',
      message: 'Se borrarán todos los libros, desafíos e historial de este navegador. No se puede deshacer.',
      confirmLabel: 'Borrar todo',
      tone: 'danger',
    });
    if (!ok) return;
    await actions.clearAll();
    toast('Datos borrados');
  };

  return (
    <div className="settings-page">
      <PageHeader title="Ajustes" />

      <section className="section" aria-labelledby="s-appearance">
        <h2 id="s-appearance" className="section-title">Apariencia</h2>
        <div className="surface">
          <Row title="Tema" desc="Sistema sigue la configuración de tu dispositivo.">
            <Segmented label="Tema" options={THEMES} value={settings.theme} onChange={(theme) => actions.updateSettings({ theme })} size="sm" />
          </Row>
        </div>
      </section>

      <section className="section" aria-labelledby="s-user">
        <h2 id="s-user" className="section-title">Participante activo</h2>
        <div className="surface">
          <Row title="Usar la app como" desc="Los libros nuevos se asignan por defecto a este participante.">
            <Segmented
              label="Participante activo"
              size="sm"
              options={users.map((u) => ({ value: u.id, label: u.shortName }))}
              value={settings.activeUserId}
              onChange={(activeUserId) => actions.updateSettings({ activeUserId })}
            />
          </Row>
        </div>
      </section>

      <section className="section" aria-labelledby="s-data">
        <h2 id="s-data" className="section-title">Datos</h2>
        <div className="surface">
          <Row title="Datos iniciales" desc="Vuelve a la Competencia por un libro con los libros cargados al inicio.">
            <button type="button" className="btn btn-secondary" onClick={reset}>
              <RotateCcw size={16} aria-hidden="true" /> Restaurar
            </button>
          </Row>
          <Row title="Empezar desde cero" desc="Borra libros, desafíos e historial. Útil para empezar vuestro primer desafío real.">
            <button type="button" className="btn btn-ghost-danger" onClick={clear}>
              <Eraser size={16} aria-hidden="true" /> Borrar datos
            </button>
          </Row>
        </div>
        <p className="settings-foot">Los datos se guardan solo en este navegador. La sincronización llegará con la versión conectada.</p>
      </section>
    </div>
  );
}
