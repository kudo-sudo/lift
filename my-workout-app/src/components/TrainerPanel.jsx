import { useEffect, useState } from 'react'
import './styles/TrainerPanel.css'

const TrainerPanel = ({ suggestedExercises, isLoadingAI, onAcceptSuggestion, planDate }) => {
  const [acceptDates, setAcceptDates] = useState({})

  useEffect(() => {
    if (!suggestedExercises || suggestedExercises.length === 0) return
    setAcceptDates((prev) => {
      const next = { ...prev }
      suggestedExercises.forEach((exercise) => {
        const latestRecordDate = exercise.suggestion?.lastDate
        next[exercise.id] = latestRecordDate || planDate
      })
      return next
    })
  }, [suggestedExercises, planDate])
  if (isLoadingAI) {
    return (
      <section className="trainer-panel">
        <div className="trainer-header">
          <h3>🏋️ AI Trainer</h3>
          <p className="trainer-subtitle">AI が提案を生成中...</p>
        </div>
        <div className="trainer-loading">
          <div className="spinner"></div>
          <p>トレーニング分析中...</p>
        </div>
      </section>
    )
  }

  if (!suggestedExercises || suggestedExercises.length === 0) {
    return null
  }

  return (
    <section className="trainer-panel">
      <div className="trainer-header">
        <h3>🏋️ AI Trainer</h3>
        <p className="trainer-subtitle">
          {suggestedExercises.length}の種目で次回セットを提案
        </p>
      </div>

      <div className="trainer-suggestions">
        {suggestedExercises.map((exercise) => {
          const { suggestion } = exercise
          return (
            <div key={exercise.id} className="suggestion-card">
              <div className="suggestion-header">
                <h4 className="suggestion-title">{suggestion.exerciseName}</h4>
                <span className="suggestion-badge">推奨</span>
              </div>

              <div className="suggestion-content">
                <div className="suggestion-row">
                  <div className="suggestion-item">
                    <span className="suggestion-label">前回</span>
                    <span className="suggestion-value">
                      {suggestion.lastWeight}kg
                      {suggestion.lastReps && (
                        <span className="suggestion-meta">
                          × {suggestion.lastReps}
                          {suggestion.lastSets ? ` × ${suggestion.lastSets}` : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="suggestion-arrow">→</div>
                  <div className="suggestion-item highlight">
                    <span className="suggestion-label">今回（最重量）</span>
                    <span className="suggestion-value">
                      {suggestion.nextWeight}kg
                      <span className="suggestion-reps">
                        × {suggestion.nextReps} × {suggestion.nextSets}
                      </span>
                    </span>
                  </div>
                </div>

                <p className="suggestion-reasoning">{suggestion.reasoning}</p>
                {suggestion.goal && (
                  <div className="suggestion-goal">
                    <div className="suggestion-goal-title">目標進捗</div>
                    <div className="suggestion-goal-grid">
                      <div>
                        <span className="suggestion-goal-label">目標</span>
                        <strong>{suggestion.goal.targetWeight}kg</strong>
                      </div>
                      <div>
                        <span className="suggestion-goal-label">現在地</span>
                        <strong>推定1RM {suggestion.goal.currentEstimated1RM}kg</strong>
                      </div>
                      <div>
                        <span className="suggestion-goal-label">達成率</span>
                        <strong>{suggestion.goal.progressPercent}%</strong>
                      </div>
                      <div>
                        <span className="suggestion-goal-label">残り</span>
                        <strong>{suggestion.goal.remainingToGoal}kg</strong>
                      </div>
                    </div>
                  </div>
                )}
                {Array.isArray(suggestion.shortMessage) && suggestion.shortMessage.length > 0 && (
                  <div className="suggestion-message">
                    {suggestion.shortMessage.map((line, index) => (
                      <div key={`${exercise.id}-msg-${index}`} className="suggestion-message-line">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(suggestion.planSets) && suggestion.planSets.length > 0 && (
                  <div className="suggestion-sets">
                    <div className="suggestion-sets-title">次回セット案</div>
                    <ul className="suggestion-sets-list">
                      {suggestion.planSets.map((planSet, index) => {
                        const weight = planSet.weight ?? suggestion.nextWeight
                        const reps = planSet.reps ?? suggestion.nextReps
                        const sets = planSet.sets
                        const suffix = sets && sets > 1 ? ` × ${sets}` : ''
                        const title = planSet.title || `セット${index + 1}`
                        return (
                          <li key={`${exercise.id}-set-${index}`}>
                            <span className="set-title">{title}</span> {weight}kg × {reps}{suffix}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <div className="suggestion-footer">
                <span className="suggestion-time">
                  💡 AI生成
                </span>
                <input
                  className="accept-date-input"
                  type="date"
                  value={
                    acceptDates[exercise.id] ||
                    suggestion.lastDate ||
                    planDate
                  }
                  onChange={(event) =>
                    setAcceptDates((prev) => ({
                      ...prev,
                      [exercise.id]: event.target.value,
                    }))
                  }
                  aria-label="Select plan date"
                />
                <button
                  className="accept-button"
                  type="button"
                  onClick={() =>
                    onAcceptSuggestion?.(
                      suggestion,
                      acceptDates[exercise.id] || suggestion.lastDate || planDate
                    )
                  }
                  aria-label="Accept AI suggestion"
                >
                  Add to Plan
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default TrainerPanel
