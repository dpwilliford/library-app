export function PlaceholderPage({
  title,
  purpose,
  futureData,
  futureActions,
  phaseNote
}: {
  title: string;
  purpose: string;
  futureData: string[];
  futureActions: string[];
  phaseNote: string;
}) {
  return (
    <section className="panel stack">
      <span className="placeholder-label">Placeholder</span>
      <h1>{title}</h1>
      <section className="placeholder-section">
        <h2>Purpose</h2>
        <p>{purpose}</p>
      </section>
      <div className="placeholder-grid">
        <section className="placeholder-section">
          <h2>Future Data</h2>
          <ul className="plain-list">
            {futureData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="placeholder-section">
          <h2>Future Actions</h2>
          <ul className="plain-list">
            {futureActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="placeholder-section phase-note">
        <h2>Current Phase Status</h2>
        <p>{phaseNote}</p>
      </section>
    </section>
  );
}
