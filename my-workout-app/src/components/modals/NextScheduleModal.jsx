const NextScheduleModal = ({
  nextScheduleDate,
  setNextScheduleDate,
  handleNextScheduleSubmit,
  handleNextScheduleClose,
}) => (
  <div className="record-modal" role="dialog" aria-modal="true">
    <div className="record-backdrop" onClick={handleNextScheduleClose} />
    <form className="record-card" onSubmit={handleNextScheduleSubmit}>
      <div className="record-header">
        <div>
          <div className="record-title">次回日程を設定</div>
        </div>
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleNextScheduleClose}
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
          value={nextScheduleDate}
          onChange={(event) => setNextScheduleDate(event.target.value)}
          required
        />
      </label>
      <div className="record-actions">
        <button className="ghost-button" type="button" onClick={handleNextScheduleClose}>
          Cancel
        </button>
        <button className="solid-button" type="submit">
          Save
        </button>
      </div>
    </form>
  </div>
)

export default NextScheduleModal
