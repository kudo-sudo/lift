const FooterNav = ({ activeTab, setActiveTab }) => (
  <footer className="footer-nav" aria-label="Primary">
    <button
      className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
      type="button"
      onClick={() => setActiveTab('home')}
    >
      <span className="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      </span>
      Home
    </button>
    <button
      className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
      type="button"
      onClick={() => setActiveTab('add')}
    >
      <span className="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      Add
    </button>
    <button
      className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
      type="button"
      onClick={() => setActiveTab('goals')}
    >
      <span className="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      </span>
      Goals
    </button>
    <button
      className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
      type="button"
      onClick={() => setActiveTab('history')}
    >
      <span className="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6 4h12a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      </span>
      History
    </button>
  </footer>
)

export default FooterNav
