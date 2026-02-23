import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const GoalsSection = ({
  goalsView,
  setGoalsView,
  liftQuery,
  setLiftQuery,
  liftTargets,
  filteredLiftTargets,
  liftTargetWeights,
  handleLiftTargetChange,
  expandedLiftTargets,
  handleLiftTargetToggle,
  getWeightRecords,
  workoutRecords,
  bodyWeightTarget,
  setBodyWeightTarget,
  weightChartReady,
  recentWeightRecords,
  yMinWeight,
  yMaxWeight,
  targetWeightNum,
  bodyWeightRecords,
  streakGoal,
  setStreakGoal,
  weeklyWorkoutCount,
  monthlyWorkoutCount,
  formatShortDate,
}) => (
  <section className="section goals">
    <div className="section-header">
      <h2>Goals</h2>
      <div className="section-meta">シンプルに管理</div>
    </div>

    {goalsView === 'main' && (
      <div className="goals-grid">
        <button className="goal-card is-button" type="button" onClick={() => setGoalsView('lift')}>
          <div className="goal-title">Lift Targets</div>
          <div className="goal-sub">各種目の目標重量</div>
        </button>
        <button className="goal-card is-button" type="button" onClick={() => setGoalsView('weight')}>
          <div className="goal-title">Body Weight</div>
          <div className="goal-sub">体重目標</div>
        </button>
        <button className="goal-card is-button" type="button" onClick={() => setGoalsView('streak')}>
          <div className="goal-title">Streak</div>
          <div className="goal-sub">継続目標</div>
        </button>
      </div>
    )}

    {goalsView === 'lift' && (
      <div className="goal-detail">
        <div className="goal-detail-header">
          <button className="ghost-button" type="button" onClick={() => setGoalsView('main')}>
            Back
          </button>
          <div className="goal-detail-title">Lift Targets</div>
        </div>
        <div className="goal-detail-body">
          <div className="library-search">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </span>
            <input
              className="search-input"
              value={liftQuery}
              onChange={(event) => setLiftQuery(event.target.value)}
              placeholder="種目名で検索"
            />
          </div>
          {liftTargets.length === 0 && <div className="empty-state">まだ登録されていません</div>}
          {liftTargets.length > 0 && filteredLiftTargets.length === 0 && (
            <div className="empty-state">該当する種目がありません</div>
          )}
          {filteredLiftTargets.length > 0 && (
            <ul className="target-list">
              {filteredLiftTargets.map((target, targetIndex) => {
                const records = workoutRecords[target.name] || []
                const weightRecords = getWeightRecords(records)
                const visibleWeightRecords = getWeightRecords(records, 20)
                const hiddenRecordCount = Math.max(weightRecords.length - visibleWeightRecords.length, 0)
                const trendSeries = [...visibleWeightRecords]
                  .reverse()
                  .map((record) => ({
                    date: record.date,
                    weight: Number.parseFloat(record.weight),
                  }))
                  .filter((entry) => Number.isFinite(entry.weight))
                const latestRecord = records[0]
                const targetWeight = Number.parseFloat(liftTargetWeights[target.name])
                const latestValue = Number.parseFloat(latestRecord?.weight)
                const remaining = Number.isFinite(targetWeight)
                  ? Math.max(
                      targetWeight - (Number.isFinite(latestValue) ? latestValue : 0),
                      0
                    )
                  : null
                const showTargetChart =
                  Number.isFinite(targetWeight) && trendSeries.length > 0
                const chartId = `lift-target-${targetIndex}`
                const minSeriesWeight = showTargetChart
                  ? Math.min(...trendSeries.map((entry) => entry.weight))
                  : 0
                const minBuffer = showTargetChart
                  ? Math.max(2, minSeriesWeight * 0.05)
                  : 0
                const maxBuffer = showTargetChart ? Math.max(2, targetWeight * 0.05) : 0
                const yMin = showTargetChart
                  ? Math.max(0, minSeriesWeight - minBuffer)
                  : 0
                const yMax = showTargetChart ? targetWeight + maxBuffer : 0

                return (
                  <li
                    className={`target-item ${expandedLiftTargets[target.name] ? 'open' : ''}`}
                    key={target.name}
                  >
                    <button
                      className="target-row"
                      type="button"
                      onClick={() => handleLiftTargetToggle(target.name)}
                    >
                      <span className="target-name">{target.name}</span>
                      <span className="target-row-toggle" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    {expandedLiftTargets[target.name] && (
                      <div className="target-panel">
                        <div className="target-panel-header">
                          <span className="target-panel-name">{target.name}</span>
                          <span className="target-panel-weight">
                            目標 {liftTargetWeights[target.name] || '--'} kg
                          </span>
                        </div>
                        <div className="target-panel-message">
                          {remaining === null
                            ? '目標重量を入力してください'
                            : `達成まであと ${remaining} kg`}
                        </div>
                        <label className="target-edit">
                          <span className="target-edit-label">目標重量</span>
                          <input
                            className="target-input"
                            value={liftTargetWeights[target.name] || ''}
                            onChange={(event) =>
                              handleLiftTargetChange(target.name, event.target.value)
                            }
                            placeholder="Target (kg)"
                          />
                        </label>
                        {showTargetChart && (
                          <div className="target-chart">
                            <div className="target-chart-title">Weight Trend（最新20件）</div>
                            <ResponsiveContainer width="100%" height={180}>
                              <AreaChart
                                data={trendSeries}
                                margin={{
                                  top: 10,
                                  right: 20,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2d9cff" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#2d9cff" stopOpacity={0.05} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={formatShortDate}
                                  stroke="rgba(255, 255, 255, 0.4)"
                                  tick={{ fill: '#9aa3af', fontSize: 11 }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  domain={[yMin, yMax]}
                                  stroke="rgba(255, 255, 255, 0.4)"
                                  tick={{ fill: '#9aa3af', fontSize: 11 }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={50}
                                />
                                <Tooltip
                                  labelFormatter={formatShortDate}
                                  formatter={(value) => [`${value} kg`, '重量']}
                                  contentStyle={{
                                    background: 'rgba(12, 14, 18, 0.95)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '12px',
                                  }}
                                  labelStyle={{ color: '#9aa3af' }}
                                />
                                <ReferenceLine
                                  y={targetWeight}
                                  stroke="#ff6b6b"
                                  strokeDasharray="6 6"
                                  label={{
                                    value: '目標ライン',
                                    fill: '#ff6b6b',
                                    fontSize: 11,
                                    position: 'insideTopRight',
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="weight"
                                  stroke="#2d9cff"
                                  strokeWidth={2}
                                  fill={`url(#${chartId})`}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        {visibleWeightRecords.length > 0 && (
                          <div className="target-records">
                            {visibleWeightRecords.map((record) => (
                              <div className="target-record" key={record.id}>
                                <span className="target-record-date">{record.date}</span>
                                <span className="target-record-weight">{record.weight} kg</span>
                              </div>
                            ))}
                            {hiddenRecordCount > 0 && (
                              <div className="weight-more-hint">
                                他{hiddenRecordCount}件はサブスクで表示
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    )}

    {goalsView === 'weight' && (
      <div className="goal-detail">
        <div className="goal-detail-header">
          <button className="ghost-button" type="button" onClick={() => setGoalsView('main')}>
            Back
          </button>
          <div className="goal-detail-title">Body Weight</div>
        </div>
        <div className="goal-detail-body">
          <div className="weight-goal-summary">目標体重 {bodyWeightTarget || '--'} kg</div>
          <label className="target-edit">
            <span className="target-edit-label">目標体重</span>
            <input
              className="target-input"
              type="number"
              inputMode="decimal"
              value={bodyWeightTarget}
              onChange={(event) => setBodyWeightTarget(event.target.value)}
              placeholder="例: 68"
              min="0"
              step="0.1"
            />
          </label>
          {weightChartReady && (
            <div className="weight-chart">
              <div className="weight-chart-title">推移（直近20個）</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={recentWeightRecords}
                  margin={{
                    top: 10,
                    right: 16,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="weight-chart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d9cff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2d9cff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="rgba(255, 255, 255, 0.4)"
                    tick={{ fill: '#9aa3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[yMinWeight, yMaxWeight]}
                    stroke="rgba(255, 255, 255, 0.4)"
                    tick={{ fill: '#9aa3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    labelFormatter={formatShortDate}
                    formatter={(value) => [`${value} kg`, '体重']}
                    contentStyle={{
                      background: 'rgba(12, 14, 18, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: '#9aa3af' }}
                  />
                  <ReferenceLine
                    y={targetWeightNum}
                    stroke="#ff6b6b"
                    strokeDasharray="6 6"
                    label={{
                      value: '目標',
                      fill: '#ff6b6b',
                      fontSize: 11,
                      position: 'insideTopRight',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2d9cff"
                    strokeWidth={2}
                    fill="url(#weight-chart)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {bodyWeightRecords.length > 0 && (
            <div className="weight-records">
              <div className="weight-records-title">全記録（{bodyWeightRecords.length}個）</div>
              <div className="weight-record-list">
                {bodyWeightRecords.slice(0, 5).map((record) => (
                  <div className="weight-record-item" key={record.id}>
                    <span className="weight-record-date">{record.date}</span>
                    <span className="weight-record-value">{record.value} kg</span>
                  </div>
                ))}
              </div>
              {bodyWeightRecords.length > 5 && (
                <div className="weight-more-hint">他{bodyWeightRecords.length - 5}件の記録</div>
              )}
            </div>
          )}
        </div>
      </div>
    )}

    {goalsView === 'streak' && (
      <div className="goal-detail">
        <div className="goal-detail-header">
          <button className="ghost-button" type="button" onClick={() => setGoalsView('main')}>
            Back
          </button>
          <div className="goal-detail-title">Streak</div>
        </div>
        <div className="goal-detail-body">
          <div className="streak-summary">
            <div className="streak-summary-item">
              <div className="streak-label">今週</div>
              <div className="streak-value">
                {weeklyWorkoutCount} / {streakGoal.weeklyTarget || '--'}
              </div>
            </div>
            <div className="streak-summary-item">
              <div className="streak-label">今月</div>
              <div className="streak-value">
                {monthlyWorkoutCount} / {streakGoal.monthlyTarget || '--'}
              </div>
            </div>
          </div>
          <label className="target-edit">
            <span className="target-edit-label">週何回</span>
            <input
              className="target-input"
              type="number"
              inputMode="numeric"
              value={streakGoal.weeklyTarget}
              onChange={(event) =>
                setStreakGoal((prev) => ({ ...prev, weeklyTarget: event.target.value }))
              }
              placeholder="例: 3"
              min="0"
            />
          </label>
          <label className="target-edit">
            <span className="target-edit-label">月何回</span>
            <input
              className="target-input"
              type="number"
              inputMode="numeric"
              value={streakGoal.monthlyTarget}
              onChange={(event) =>
                setStreakGoal((prev) => ({ ...prev, monthlyTarget: event.target.value }))
              }
              placeholder="例: 12"
              min="0"
            />
          </label>
        </div>
      </div>
    )}
  </section>
)

export default GoalsSection
