import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import Modal from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

const AVATAR_COLORS = ['#b5643c', '#3d6b73', '#1d6b57', '#5b3a5e', '#1f3a5f', '#9d4a61', '#6b7a3a', '#8c3b2e'];

function ProfileForm({ user, onDone }) {
  const { actions } = useAppData();
  const { toast } = useToast();
  const [v, setV] = useState({ name: user.name, shortName: user.shortName, bio: user.bio || '', color: user.color });
  const [error, setError] = useState('');
  const uid = useId();
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    if (!v.name.trim() || !v.shortName.trim()) {
      setError('El nombre y el nombre corto son obligatorios.');
      return;
    }
    await actions.updateUser(user.id, { ...v, name: v.name.trim(), shortName: v.shortName.trim(), bio: v.bio.trim() });
    toast('Perfil actualizado');
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-n`}>Nombre completo</label>
          <input id={`${uid}-n`} className="field-input" value={v.name} onChange={set('name')} maxLength={50} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-s`}>Nombre corto</label>
          <input id={`${uid}-s`} className="field-input" value={v.shortName} onChange={set('shortName')} maxLength={16} />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${uid}-b`}>Sobre ti <span className="field-optional">Opcional</span></label>
        <textarea id={`${uid}-b`} className="field-input" rows={3} value={v.bio} onChange={set('bio')} maxLength={160} />
      </div>
      <div className="field">
        <span className="field-label" id={`${uid}-c`}>Color</span>
        <div className="swatches" role="radiogroup" aria-labelledby={`${uid}-c`}>
          {AVATAR_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={v.color === c} aria-label={`Color ${c}`} className="swatch is-round" style={{ '--swatch': c }} onClick={() => set('color')(c)}>
              {v.color === c && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="modal-foot is-inline">
        <button type="button" className="btn btn-secondary" onClick={onDone}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar</button>
      </div>
    </form>
  );
}

export default function ProfileEditModal({ user, open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" size="md">
      {user && <ProfileForm key={`${user.id}-${open}`} user={user} onDone={onClose} />}
    </Modal>
  );
}
