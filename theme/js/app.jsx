const { useState, useEffect } = React;

function App() {
  const [events, setEvents] = useState([]);
  const [query,  setQuery]  = useState({ name: '', region: '', date: '' });

  // Load YAML once
  useEffect(() => {
    fetch('events.yaml')
      .then(res => res.text())
      .then(text => setEvents(jsyaml.load(text) || []))
      .catch(err => console.error('Failed to load events:', err));
  }, []);

  const regions = [...new Set(events.map(e => e.region))].sort();

  // Filter in real-time
  const filtered = events.filter(evt => {
    const nameMatch   = evt.title.toLowerCase().includes(query.name.toLowerCase());
    const regionMatch = query.region ? evt.region === query.region : true;
    const dateMatch   = query.date ? evt.date === query.date : true;
    return nameMatch && regionMatch && dateMatch;
  });

  return (
    <>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name…"
          value={query.name}
          onChange={e => setQuery({ ...query, name: e.target.value })}
        />

        <select
          value={query.region}
          onChange={e => setQuery({ ...query, region: e.target.value })}
        >
          <option value="">All regions</option>
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <input
          type="date"
          value={query.date}
          onChange={e => setQuery({ ...query, date: e.target.value })}
        />
      </div>

      {filtered.map(evt => (
        <article key={evt.title} className="event-card">
          <h2 className="event-title">{evt.title}</h2>
          <div className="event-meta">
            {evt.date} &nbsp;•&nbsp; {evt.location} &nbsp;•&nbsp; {evt.region}
          </div>
          <p className="event-desc">{evt.description}</p>
        </article>
      ))}

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          No events match your filters.
        </p>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('event-app')).render(<App />);
