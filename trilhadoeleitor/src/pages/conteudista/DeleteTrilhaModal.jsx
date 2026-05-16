export default function DeleteTrilhaModal({ aberta, onCancelar, onConfirmar }) {
  if (!aberta) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3>Excluir trilha</h3>
        <p>Tem certeza que deseja excluir esta trilha? Essa ação não poderá ser desfeita.</p>
        <div className="modal-actions">
          <button type="button" className="btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn-perigo" onClick={onConfirmar}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
