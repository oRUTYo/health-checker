export default function Header({ status }) {
  const pills = {
    checking: { color: '#9ca3af', label: 'подключение...' },
    online:   { color: '#16a34a', label: 'бэкенд активен' },
    offline:  { color: '#dc2626', label: 'бэкенд недоступен' },
  }
  const { color, label } = pills[status] ?? pills.checking

  return (
    <header className="header">
      <a className="logo" href="/">
        <div className="logo-mark">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polyline
              points="0,8 3,8 5,2 8,14 10,4 12,8 16,8"
              stroke="#2563eb" strokeWidth="1.5"
              fill="none" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        Beat<span>Sense</span>
      </a>

      <div className="status-pill">
        <span
          className="status-dot"
          style={{
            background: color,
            ...(status === 'online' ? { boxShadow: `0 0 0 2px ${color}33` } : {}),
          }}
        />
        {label}
      </div>
    </header>
  )
}
