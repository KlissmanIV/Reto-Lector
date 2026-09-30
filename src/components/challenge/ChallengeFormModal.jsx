import { useId, useState } from 'react';
import Modal from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import { addDays, daysBetween, todayISO } from '../../utils/dates';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function ChallengeForm({ challenge, onDone, onCancel }) {
  const { actions } = useAppData();
  const { toast } = useToast();
  const isEdit = !!challenge;
  const today = todayISO();
  const [values, setValues] = useState(() =>
    challenge
      ? { name: challenge.name, startDate: challenge.startDate, endDate: challenge.endDate }
      : { name: `Desafío de ${MONTHS[new Date().getMonth()]}`, startDate: today, endDate: addDays(today, 30) },
  );
  const [errors, setErrors] = useState({});
  const uid = useId();

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!values.name.trim()) er.name = 'Ponle un nombre al desafío.';
    if (!values.startDate) er.startDate = 'Elige una fecha de inicio.';
    if (!values.endDate) er.endDate = 'Elige una fecha de fin.';
    else if (values.endDate < values.startDate) er.endDate = 'La fecha de fin debe ser posterior al inicio.';
    else if (!isEdit && values.endDate < today) er.endDate = 'La fecha de fin no puede estar en el pasado.';
    setErrors(er);
    if (Object.keys(er).length) return;

    try {
      if (isEdit) {
        await actions.updateChallenge(challenge.id, { name: values.name.trim(), startDate: values.startDate, endDate: values.endDate });
        toast('Desafío actualizado');
      } else {
        await actions.createChallenge(values);
        toast('Desafío creado. ¡Que empiece la lectura!');
      }
      onDone();
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };

  const duration = values.startDate && values.endDate && values.endDate >= values.startDate
    ? daysBetween(values.startDate, values.endDate) + 1
    : null;

  const fieldProps = (k) => ({
    id: `${uid}-${k}`,
    value: values[k],
    onChange: set(k),
    className: `field-input ${errors[k] ? 'is-invalid' : ''}`,
    'aria-invalid': !!errors[k],
    'aria-describedby': errors[k] ? `${uid}-${k}-err` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor={`${uid}-name`}>Nombre</label>
        <input {...fieldProps('name')} maxLength={60} autoComplete="off" />
        {errors.name && <p className="field-error" id={`${uid}-name-err`}>{errors.name}</p>}
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-startDate`}>Inicio</label>
          <input {...fieldProps('startDate')} type="date" />
          {errors.startDate && <p className="field-error" id={`${uid}-startDate-err`}>{errors.startDate}</p>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${uid}-endDate`}>Fin</label>
          <input {...fieldProps('endDate')} type="date" min={values.startDate} />
          {errors.endDate && <p className="field-error" id={`${uid}-endDate-err`}>{errors.endDate}</p>}
        </div>
      </div>
      {duration && <p className="field-hint">Duración: {duration} {duration === 1 ? 'día' : 'días'}. Solo cuentan los libros terminados dentro de estas fechas.</p>}

      <div className="modal-foot is-inline">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{isEdit ? 'Guardar cambios' : 'Crear desafío'}</button>
      </div>
    </form>
  );
}

export default function ChallengeFormModal({ state, onClose }) {
  return (
    <Modal open={state.open} onClose={onClose} title={state.challenge ? 'Editar desafío' : 'Nuevo desafío'} size="md">
      <ChallengeForm key={state.key} challenge={state.challenge} onDone={onClose} onCancel={onClose} />
    </Modal>
  );
}
