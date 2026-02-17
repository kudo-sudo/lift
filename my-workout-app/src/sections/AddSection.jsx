const AddSection = ({
  libraryQuery,
  setLibraryQuery,
  handleLibrarySubmit,
  draftExerciseName,
  setDraftExerciseName,
  draftBodyPart,
  setDraftBodyPart,
  bodyPartOptions,
  showFavoritesOnly,
  setShowFavoritesOnly,
  filteredLibrary,
  expandedBodyParts,
  toggleBodyPart,
  handleLibraryToggleFavorite,
  handleLibraryAddToPlan,
  handleLibraryDelete,
  exerciseLibrary,
}) => (
  <section className="section library">
    <div className="section-header">
      <h2>Exercise Library</h2>
      <div className="section-meta">部位ごとに整理</div>
    </div>
    <div className="library-search">
      <span className="search-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        className="search-input"
        value={libraryQuery}
        onChange={(event) => setLibraryQuery(event.target.value)}
        placeholder="種目名や部位で検索"
      />
    </div>
    <form className="library-form" onSubmit={handleLibrarySubmit}>
      <div className="library-form-hint">種目と体の部分を設定してAddボタンで追加する</div>
      <label className="field">
        <span className="field-label">Workout</span>
        <input
          className="field-input"
          value={draftExerciseName}
          onChange={(event) => setDraftExerciseName(event.target.value)}
          placeholder="例: Incline Bench Press"
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Body Part</span>
        <input
          className="field-input"
          value={draftBodyPart}
          onChange={(event) => setDraftBodyPart(event.target.value)}
          placeholder="例: Chest / Back / Legs"
          list="body-part-options"
          required
        />
        <datalist id="body-part-options">
          {bodyPartOptions.map((part) => (
            <option key={part} value={part} />
          ))}
        </datalist>
      </label>
      <div className="library-actions">
        <button className="solid-button" type="submit">
          Add
        </button>
      </div>
    </form>

    <div className="library-hint">プラスボタンを押してToday Planに追加</div>
    <div className="library-filters">
      <button
        className={`ghost-button ${showFavoritesOnly ? 'is-active' : ''}`}
        type="button"
        onClick={() => setShowFavoritesOnly((prev) => !prev)}
      >
        お気に入りのみ
      </button>
    </div>

    <div className="library-groups">
      {exerciseLibrary.length === 0 && (
        <div className="empty-state">まだ登録されていません</div>
      )}
      {exerciseLibrary.length > 0 && filteredLibrary.length === 0 && (
        <div className="empty-state">該当する種目がありません</div>
      )}
      {filteredLibrary.map((group) => {
        const isExpanded = expandedBodyParts[group.bodyPart] ?? true
        return (
          <div
            className={`library-group ${isExpanded ? 'open' : 'collapsed'}`}
            key={group.bodyPart}
          >
            <button
              className="library-group-header"
              type="button"
              onClick={() => toggleBodyPart(group.bodyPart)}
              aria-expanded={isExpanded}
            >
              <span className="library-group-title">{group.bodyPart}</span>
              <span className="library-group-toggle" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            <ul className="library-list" aria-hidden={!isExpanded}>
              {group.items.map((entry) => (
                <li
                  className={`library-item ${entry.favorite ? 'is-favorite' : ''}`}
                  key={entry.id}
                >
                  <span>{entry.name}</span>
                  <div className="library-item-actions">
                    <button
                      className={`library-favorite ${entry.favorite ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => handleLibraryToggleFavorite(entry.id)}
                      aria-pressed={entry.favorite}
                      aria-label="お気に入り"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                    <button
                      className="library-add"
                      type="button"
                      onClick={() => handleLibraryAddToPlan(entry)}
                      aria-label="Add to Today Plan"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                    <button
                      className="library-delete"
                      type="button"
                      onClick={() =>
                        handleLibraryDelete(
                          entry,
                          exerciseLibrary.findIndex((item) => item.id === entry.id)
                        )
                      }
                      aria-label="Remove exercise"
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
          </div>
        )
      })}
    </div>
  </section>
)

export default AddSection
