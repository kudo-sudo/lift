const RecordModal = ({
  isRecordEditing,
  recordExercise,
  recordDate,
  setRecordDate,
  recordWeight,
  setRecordWeight,
  recordReps,
  setRecordReps,
  recordSets,
  setRecordSets,
  recordMemo,
  setRecordMemo,
  recordOutcome,
  setRecordOutcome,
  recordChestTouch,
  setRecordChestTouch,
  recordAllTiersDone,
  setRecordAllTiersDone,
  handleRecordSubmit,
  handleRecordClose,
}) => (
  <div className="record-modal" role="dialog" aria-modal="true">
    <div className="record-backdrop" onClick={handleRecordClose} />
    <form className="record-card" onSubmit={handleRecordSubmit}>
      <div className="record-header">
        <div>
          <div className="record-title">{isRecordEditing ? 'Edit Record' : 'Record'}</div>
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
        <span className="field-label">Reps (回数)</span>
        <input
          className="field-input"
          type="number"
          inputMode="numeric"
          value={recordReps}
          onChange={(event) => setRecordReps(event.target.value)}
          placeholder="例: 8"
          min="0"
          step="1"
        />
      </label>
      <label className="field">
        <span className="field-label">Sets (セット)</span>
        <input
          className="field-input"
          type="number"
          inputMode="numeric"
          value={recordSets}
          onChange={(event) => setRecordSets(event.target.value)}
          placeholder="例: 3"
          min="0"
          step="1"
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
      <div className="record-toggle-group">
        <span className="field-label">結果</span>
        <div className="record-toggle-row">
          <button
            className={`record-toggle ${recordOutcome === 'success' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setRecordOutcome('success')}
          >
            成功
          </button>
          <button
            className={`record-toggle ${recordOutcome === 'failure' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setRecordOutcome('failure')}
          >
            失敗
          </button>
        </div>
      </div>
      <div className="record-toggle-group">
        <span className="field-label">フォーム</span>
        <div className="record-toggle-row">
          <button
            className={`record-toggle ${recordChestTouch ? 'is-active' : ''}`}
            type="button"
            onClick={() => setRecordChestTouch(true)}
          >
            胸タッチ達成
          </button>
          <button
            className={`record-toggle ${!recordChestTouch ? 'is-active' : ''}`}
            type="button"
            onClick={() => setRecordChestTouch(false)}
          >
            浅め/未達
          </button>
        </div>
      </div>
      <div className="record-toggle-group">
        <span className="field-label">AIメニュー達成</span>
        <div className="record-toggle-row">
          <button
            className={`record-toggle ${recordAllTiersDone ? 'is-active' : ''}`}
            type="button"
            onClick={() => setRecordAllTiersDone((prev) => !prev)}
          >
            ①②③できた
          </button>
          <button
            className="record-toggle"
            type="button"
            onClick={() =>
              setRecordMemo((prev) => (prev ? `${prev} / ①②③できた` : '①②③できた'))
            }
          >
            メモに追加
          </button>
        </div>
      </div>
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
