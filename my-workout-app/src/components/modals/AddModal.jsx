const AddModal = ({
  planDateLabel,
  draftTitle,
  setDraftTitle,
  draftMeta,
  setDraftMeta,
  draftSets,
  handleSetChange,
  handleDuplicateCountChange,
  handleDuplicateCountApply,
  handleRemoveSetRow,
  handleAddSetRow,
  handleAddSubmit,
  handleAddClose,
}) => (
  <div className="add-modal" role="dialog" aria-modal="true">
    <div className="add-backdrop" onClick={handleAddClose} />
    <form className="add-card" onSubmit={handleAddSubmit}>
      <div className="add-header">
        <div>
          <div className="add-title">Menu: {planDateLabel || '未選択'}</div>
          <div className="add-subtitle">新しいメニューを追加</div>
        </div>
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleAddClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      </div>
      <label className="field">
        <span className="field-label">Workout</span>
        <input
          className="field-input"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          placeholder="例: インクライン Bench Press"
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Notes</span>
        <input
          className="field-input"
          value={draftMeta}
          onChange={(event) => setDraftMeta(event.target.value)}
          placeholder="例: 4 x 8 · 60kg"
        />
      </label>
      <div className="field">
        <span className="field-label">Drop set</span>
        <div className="set-builder">
          {draftSets.map((row, index) => (
            <div className="set-builder-row" key={row.id}>
              <div className="set-builder-title">Set {index + 1}</div>
              <input
                className="field-input compact"
                value={row.weight}
                onChange={(event) => handleSetChange(row.id, 'weight', event.target.value)}
                placeholder="Weight (例: 70kg)"
              />
              <input
                className="field-input compact"
                value={row.reps}
                onChange={(event) => handleSetChange(row.id, 'reps', event.target.value)}
                placeholder="Reps (例: 6)"
              />
              <input
                className="field-input compact"
                type="number"
                inputMode="numeric"
                value={row.copyCount || ''}
                onChange={(event) =>
                  handleDuplicateCountChange(row.id, event.target.value)
                }
                onBlur={() => handleDuplicateCountApply(row.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleDuplicateCountApply(row.id)
                  }
                }}
                placeholder="複製数"
                min="1"
                max="10"
                aria-label="Duplicate set count"
              />
              <button
                className="row-delete"
                type="button"
                onClick={() => handleRemoveSetRow(row.id)}
                aria-label="Remove set row"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 7h16" />
                  <path d="M9 7V5h6v2" />
                  <path d="M9 11v6M15 11v6" />
                  <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button className="add-set" type="button" onClick={handleAddSetRow}>
          + Add Set
        </button>
      </div>
      <div className="add-actions">
        <button className="ghost-button" type="button" onClick={handleAddClose}>
          Cancel
        </button>
        <button className="solid-button" type="submit">
          Add
        </button>
      </div>
    </form>
  </div>
)

export default AddModal
