import Modal from './Modal';

export default function ConfirmDialog({ state, onResolve }) {
  const { title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'primary' } = state.options || {};
  return (
    <Modal
      open={state.open}
      onClose={() => onResolve(false)}
      title={title}
      size="sm"
      className="confirm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => onResolve(false)} data-autofocus={tone === 'danger' || undefined}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={() => onResolve(true)} data-autofocus={tone !== 'danger' || undefined}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="confirm-message">{message}</p>}
    </Modal>
  );
}
