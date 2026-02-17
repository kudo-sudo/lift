const WeightRecordModal = ({
  weightRecordDate,
  setWeightRecordDate,
  weightRecordValue,
  setWeightRecordValue,
  handleWeightRecordSubmit,
  handleWeightRecordClose,
}) => (
  <div className="record-modal" role="dialog" aria-modal="true">
    <div className="record-backdrop" onClick={handleWeightRecordClose} />
    <form className="record-card" onSubmit={handleWeightRecordSubmit}>
      <div className="record-header">
        <div>
          <div className="record-title">体重を記録</div>
        </div>
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleWeightRecordClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        </button>
      </div>
      <label className="field">
        <span className="field-label">日付</span>
        <input
          className="field-input"
          type="date"
          value={weightRecordDate}
          onChange={(event) => setWeightRecordDate(event.target.value)}
          required
        />
      </label>
      <label className="field">
        <span className="field-label">体重 (kg)</span>
        <input
          className="field-input"
          type="number"
          inputMode="decimal"
          value={weightRecordValue}
          onChange={(event) => setWeightRecordValue(event.target.value)}
          placeholder="例: 70.5"
          min="0"
          step="0.1"
          required
        />
      </label>
      <div className="record-actions">
        <button className="ghost-button" type="button" onClick={handleWeightRecordClose}>
          Cancel
        </button>
        <button className="solid-button" type="submit">
          Save
        </button>
      </div>
    </form>
  </div>
)

export default WeightRecordModal
