const UndoToast = ({ undoState, onUndo }) => (
  <div className="undo-toast" role="status" aria-live="polite">
    <span>
      {undoState.type === 'plan'
        ? `${undoState.item.title} を削除しました`
        : undoState.type === 'set'
          ? `${undoState.planTitle} / ${undoState.setItem.title} を削除しました`
          : `${undoState.entry.name} を削除しました`}
    </span>
    <button className="undo-button" type="button" onClick={onUndo}>
      Undo
    </button>
  </div>
)

export default UndoToast
