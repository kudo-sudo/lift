const HistorySection = ({
  monthlyWorkoutCount,
  historyYear,
  historyMonth,
  handleHistoryPrevMonth,
  handleHistoryNextMonth,
  weekDaysShort,
  calendarDays,
  historyDate,
  setHistoryDate,
  recordsByDate,
  selectedHistoryRecords,
  formatHistoryDate,
  formatDateKey,
  getTodayKey,
}) => (
  <section className="section history">
    <div className="section-header">
      <h2>History</h2>
      <div className="section-meta">今月の記録</div>
    </div>
    <div className="history-card">
      <div className="history-summary">
        <div className="history-summary-label">今月</div>
        <div className="history-summary-value">{monthlyWorkoutCount} 回</div>
      </div>
      <div className="history-calendar-header">
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleHistoryPrevMonth}
          aria-label="Previous month"
        >
          <svg viewBox="0 0 24 24">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="history-month">
          {historyYear}年{historyMonth + 1}月
        </div>
        <button
          className="icon-button ghost"
          type="button"
          onClick={handleHistoryNextMonth}
          aria-label="Next month"
        >
          <svg viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      <div className="history-weekdays">
        {weekDaysShort.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="history-grid">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div className="history-cell is-empty" key={`empty-${index}`} />
          }
          const dateKey = formatDateKey(historyYear, historyMonth, day)
          const hasWorkouts = recordsByDate.has(dateKey)
          const isSelected = historyDate === dateKey
          const isToday = dateKey === getTodayKey()

          return (
            <button
              className={`history-day${hasWorkouts ? ' has-workout' : ''}${
                isSelected ? ' is-selected' : ''
              }${isToday ? ' is-today' : ''}`}
              type="button"
              key={dateKey}
              onClick={() => setHistoryDate(dateKey)}
              aria-pressed={isSelected}
              aria-label={`Select ${dateKey}`}
            >
              <span className="history-day-number">{day}</span>
              {hasWorkouts && <span className="history-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
    <div className="history-records">
      <div className="history-records-header">{formatHistoryDate(historyDate)}</div>
      {selectedHistoryRecords.length === 0 && (
        <div className="empty-state">この日の記録はありません</div>
      )}
      {selectedHistoryRecords.length > 0 && (
        <div className="history-record-list">
          {selectedHistoryRecords.map((record) => (
            <div className="history-record-item" key={record.id}>
              <div className="history-record-title">{record.type}</div>
              <div className="history-record-meta">
                {record.weight} kg{record.memo ? ` · ${record.memo}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="history-notice">
      <div className="history-notice-title">データの取り扱い</div>
      <p>
        このアプリの記録は端末内（ローカルストレージ）に保存されます。サーバーには送信されません。
        ブラウザのデータを削除すると記録も消えます。
      </p>
    </div>
  </section>
)

export default HistorySection
