const HomeSection = ({
  planItems,
  doneItems,
  expandedItems,
  setChecks,
  toggleItem,
  toggleExpand,
  toggleSet,
  handleRecordOpen,
  handlePlanDelete,
  handleSetDelete,
  setActiveTab,
  setDoneItems,
  bodyWeightRecords,
  handleWeightRecordOpen,
  nextScheduleDate,
  formatHistoryDate,
  handleNextScheduleOpen,
}) => (
  <>
    <section className="section">
      <div className="section-header">
        <h2>Today Plan</h2>
        <div className="section-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => setActiveTab('add')}
            aria-label="Go to Add"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="ghost-button" type="button" onClick={() => setDoneItems([])}>
            Reset
          </button>
        </div>
      </div>
      {planItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">今日のメニューがありません</div>
          <button className="solid-button" type="button" onClick={() => setActiveTab('add')}>
            Addタブから追加
          </button>
        </div>
      )}
      <ul className="checklist">
        {planItems.map((item, index) => {
          const isDone = doneItems.includes(item.id)
          const isExpanded = expandedItems.includes(item.id)
          const setStatus = setChecks[item.id] || []
          return (
            <li
              className={`checklist-item ${isDone ? 'done' : ''}`}
              key={item.id}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="checklist-row">
                <label className="checklist-label">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className="checkmark" aria-hidden="true" />
                  <span className="checklist-text">
                    <span className="checklist-title">{item.title}</span>
                    <span className="checklist-meta">{item.meta}</span>
                  </span>
                </label>
                <div className="checklist-actions">
                  {item.sets && (
                    <button
                      className={`pill-button ${isExpanded ? 'active' : ''}`}
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      aria-expanded={isExpanded}
                    >
                      Sets
                      <svg viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                  <button
                    className="record-button"
                    type="button"
                    onClick={() => handleRecordOpen(item)}
                    aria-label="Record workout"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 19V8" />
                      <path d="M10 19V5" />
                      <path d="M16 19v-7" />
                      <path d="M22 19V9" />
                    </svg>
                  </button>
                  <button
                    className="plan-delete"
                    type="button"
                    onClick={() => handlePlanDelete(item, index)}
                    aria-label="Remove workout"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 7h16" />
                      <path d="M9 7V5h6v2" />
                      <path d="M9 11v6M15 11v6" />
                      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                    </svg>
                  </button>
                </div>
              </div>
              {item.sets && isExpanded && (
                <ul className="setlist">
                  {item.sets.map((setItem, setIndex) => (
                    <li className="set-item" key={setItem.id}>
                      <div className="set-row">
                        <label className="set-label">
                          <input
                            type="checkbox"
                            checked={Boolean(setStatus[setIndex])}
                            onChange={() => toggleSet(item.id, setIndex)}
                          />
                          <span className="set-checkmark" aria-hidden="true" />
                          <span className="set-text">
                            <span className="set-title">{setItem.title}</span>
                            <span className="set-meta">{setItem.meta}</span>
                          </span>
                        </label>
                        <button
                          className="set-delete"
                          type="button"
                          onClick={() =>
                            handleSetDelete(
                              item,
                              setItem,
                              setIndex,
                              Boolean(setStatus[setIndex])
                            )
                          }
                          aria-label="Remove set"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M4 7h16" />
                            <path d="M9 7V5h6v2" />
                            <path d="M9 11v6M15 11v6" />
                            <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>

    <section className="section stats">
      <button className="stat-card" type="button" onClick={handleWeightRecordOpen}>
        <div className="stat-label">体重を記録</div>
        <div className="stat-value">
          {bodyWeightRecords.length > 0 ? `${bodyWeightRecords[0].value} kg` : '--'}
        </div>
      </button>
      <button className="stat-card" type="button" onClick={handleNextScheduleOpen}>
        <div className="stat-label">次回日程</div>
        <div className="stat-value">
          {nextScheduleDate ? formatHistoryDate(nextScheduleDate) : '--'}
        </div>
      </button>
    </section>
  </>
)

export default HomeSection
