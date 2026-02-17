const HeaderHero = ({ activeTab, heroDateLabel, progress }) => (
  <header className="hero">
    <div className="brand">
      <div className="brand-mark">LIFT</div>
    </div>
    {activeTab === 'home' && (
      <div className="hero-card">
        <div className="hero-date">{heroDateLabel}</div>
        <div className="hero-progress">
          <span>{progress.done}</span>
          <span className="hero-progress-divider">/</span>
          <span>{progress.total}</span>
          <span className="hero-progress-label">done</span>
        </div>
      </div>
    )}
  </header>
)

export default HeaderHero
