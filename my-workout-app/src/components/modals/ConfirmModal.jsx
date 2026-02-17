const ConfirmModal = ({ confirmState, onConfirmDelete, onClose }) => (
  <div className="confirm-modal" role="dialog" aria-modal="true">
    <div className="confirm-backdrop" onClick={onClose} />
    <div className="confirm-card">
      <div className="confirm-title">Delete?</div>
      <div className="confirm-text">
        {confirmState.type === 'plan'
          ? `${confirmState.item.title} を削除しますか？`
          : confirmState.type === 'set'
            ? `${confirmState.planTitle} / ${confirmState.setItem.title} を削除しますか？`
            : `${confirmState.entry.name} を削除しますか？\nHome と Goals からも削除されます。`}
      </div>
      <div className="confirm-actions">
        <button className="ghost-button" type="button" onClick={onClose}>
          Cancel
        </button>
        <button className="danger-button" type="button" onClick={onConfirmDelete}>
          Delete
        </button>
      </div>
    </div>
  </div>
)

export default ConfirmModal
