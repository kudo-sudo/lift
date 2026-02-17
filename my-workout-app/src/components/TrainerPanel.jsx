import './styles/TrainerPanel.css'

const TrainerPanel = ({ suggestedExercises }) => {
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
                    <span className="suggestion-label">今回</span>
                    <span className="suggestion-value">
                      {suggestion.nextWeight}kg
                      <span className="suggestion-reps">
                        × {suggestion.nextReps} × {suggestion.nextSets}
                      </span>
                    </span>
                  </div>
                </div>

                <p className="suggestion-reasoning">{suggestion.reasoning}</p>
              </div>

              <div className="suggestion-footer">
                <span className="suggestion-time">
                  💡 AI生成
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default TrainerPanel
