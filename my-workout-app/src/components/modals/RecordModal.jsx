const RecordModal = ({
  recordExercise,
  recordDate,
  setRecordDate,
  recordWeight,
  setRecordWeight,
  recordMemo,
  setRecordMemo,
  handleRecordSubmit,
  handleRecordClose,
}) => (
  <div className="record-modal" role="dialog" aria-modal="true">
    <div className="record-backdrop" onClick={handleRecordClose} />
    <form className="record-card" onSubmit={handleRecordSubmit}>
      <div className="record-header">
        <div>
          <div className="record-title">Record</div>
          <div className="record-subtitle">{recordExercise}</div>
        </div>
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleRecordClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      </div>
      <label className="field">
        <span className="field-label">Date</span>
        <input
          className="field-input"
          type="date"
          value={recordDate}
          onChange={(event) => setRecordDate(event.target.value)}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Weight (kg)</span>
        <input
          className="field-input"
          type="number"
          inputMode="decimal"
          value={recordWeight}
          onChange={(event) => setRecordWeight(event.target.value)}
          placeholder="例: 80"
          min="0"
          step="0.5"
          required
        />
      </label>
      <label className="field">
        <span className="field-label">メモ</span>
        <input
          className="field-input"
          value={recordMemo}
          onChange={(event) => setRecordMemo(event.target.value)}
          placeholder="例: フォーム良かった"
        />
      </label>
      <div className="record-actions">
        <button className="ghost-button" type="button" onClick={handleRecordClose}>
          Cancel
        </button>
        <button className="solid-button" type="submit">
          Save
        </button>
      </div>
    </form>
  </div>
)

export default RecordModal
