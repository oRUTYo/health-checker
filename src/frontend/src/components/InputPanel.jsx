import { useState, useCallback, useRef } from 'react'

// Реальные сигналы из MIT-BIH (mitbih_test.csv), по одному на класс.
// Подобраны так, чтобы бэкенд классифицировал их с confidence >= 0.95.
const DEMO_SIGNALS = {
  normal: [1.0, 0.7583, 0.1116, 0.0, 0.0806, 0.0785, 0.0661, 0.0496, 0.0475, 0.0351, 0.031, 0.0289, 0.0351, 0.0269, 0.0393, 0.0351, 0.0434, 0.0475, 0.0537, 0.0537, 0.0702, 0.0723, 0.0847, 0.0971, 0.1219, 0.1322, 0.1694, 0.1963, 0.2149, 0.2355, 0.2541, 0.2645, 0.2851, 0.2727, 0.2665, 0.2397, 0.2149, 0.1736, 0.157, 0.124, 0.1219, 0.1074, 0.1054, 0.0971, 0.1054, 0.0992, 0.1054, 0.0992, 0.1074, 0.1074, 0.1157, 0.1116, 0.1219, 0.1116, 0.1198, 0.1116, 0.1136, 0.1116, 0.1219, 0.1054, 0.1074, 0.1012, 0.1012, 0.0868, 0.093, 0.0847, 0.0826, 0.0785, 0.0785, 0.0702, 0.0764, 0.0682, 0.0785, 0.0702, 0.0682, 0.0682, 0.0744, 0.0723, 0.0909, 0.1012, 0.1074, 0.1054, 0.1219, 0.1157, 0.1095, 0.0971, 0.1033, 0.0971, 0.0868, 0.0723, 0.0702, 0.0537, 0.0579, 0.0496, 0.0579, 0.0517, 0.0558, 0.0537, 0.0537, 0.0, 0.0124, 0.188, 0.6818, 0.9752, 0.6157, 0.0413, 0.0124, 0.0868, 0.0661, 0.0661, 0.0517, 0.0393, 0.0434, 0.0331, 0.0413, 0.0351, 0.0455, 0.0413, 0.0455, 0.0434, 0.0496, 0.0475, 0.064, 0.0682, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  supraventricular: [0.9728, 0.7284, 0.0, 0.037, 0.163, 0.1432, 0.1235, 0.1407, 0.1333, 0.0963, 0.0988, 0.079, 0.0938, 0.084, 0.1062, 0.1185, 0.158, 0.1284, 0.1383, 0.1259, 0.1457, 0.1753, 0.2025, 0.2025, 0.2346, 0.237, 0.2247, 0.2, 0.1901, 0.163, 0.1284, 0.1235, 0.1111, 0.0963, 0.116, 0.0938, 0.1185, 0.1259, 0.1235, 0.1259, 0.1383, 0.1235, 0.1407, 0.1432, 0.1827, 0.3778, 0.7284, 1.0, 0.6346, 0.0198, 0.0765, 0.1778, 0.1728, 0.1358, 0.1284, 0.1185, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  ventricular: [0.0, 0.0412, 0.1124, 0.1461, 0.2022, 0.3221, 0.3633, 0.4139, 0.427, 0.485, 0.5112, 0.5206, 0.5487, 0.5993, 0.6067, 0.6404, 0.6648, 0.7303, 0.7809, 0.8521, 0.897, 0.9532, 0.97, 1.0, 0.9925, 0.985, 0.9438, 0.8989, 0.824, 0.7528, 0.7116, 0.6667, 0.603, 0.5768, 0.5974, 0.6704, 0.5955, 0.5131, 0.4232, 0.2772, 0.1199, 0.0824, 0.0225, 0.0393, 0.0543, 0.0637, 0.1985, 0.3034, 0.3558, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
}

// ── Parser (exported for App.jsx) ────────────────────────────────────────────
export function parseSignal(raw) {
  const text = (raw || '').trim()
  if (!text) throw new Error('Введите данные сигнала')

  let arr
  try {
    arr = JSON.parse(text)
  } catch {
    const parts = text.split(/[\s,;\n\r]+/).filter(Boolean)
    if (!parts.length) throw new Error('Не удалось распознать формат данных')
    arr = parts.map((s, i) => {
      const n = parseFloat(s)
      if (isNaN(n)) throw new Error(`Некорректное значение [${i + 1}]: "${s}"`)
      return n
    })
  }

  if (!Array.isArray(arr)) throw new Error('Данные должны быть массивом чисел')
  if (arr.length < 10)     throw new Error(`Слишком мало точек: ${arr.length} (минимум 10)`)
  if (arr.length > 50000)  throw new Error(`Слишком много точек: ${arr.length} (максимум 50 000)`)
  return arr.map(Number)
}

// ── Demo info ─────────────────────────────────────────────────────────────────
const DEMOS = [
  {
    id: 'normal',
    letter: 'N',
    color: '#2563eb',
    bg: '#eff6ff',
    name: 'Нормальный',
    desc: 'Синусовый ритм, P-QRS-T форма',
  },
  {
    id: 'ventricular',
    letter: 'V',
    color: '#dc2626',
    bg: '#fef2f2',
    name: 'Желудочковый',
    desc: 'Широкий комплекс QRS, аномалия',
  },
  {
    id: 'supraventricular',
    letter: 'S',
    color: '#b45309',
    bg: '#fffbeb',
    name: 'Наджелудочковый',
    desc: 'Узкий комплекс, малый P',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function InputPanel({
  onSignal,
  signal,
  loading,
  onPredict,
  history,
  onHistoryClick,
  onHistoryClear,
}) {
  const [tab, setTab] = useState('text')
  const [textValue, setTextValue] = useState('')
  const [validation, setValidation] = useState(null) // null | { ok, msg, count }
  const [dragOver, setDragOver] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState(null)
  const fileRef = useRef()

  const demoSignals = DEMO_SIGNALS

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = useCallback((text) => {
    if (!text.trim()) { setValidation(null); onSignal(null); return }
    try {
      const sig = parseSignal(text)
      setValidation({ ok: true, msg: `${sig.length} точек · диапазон [${Math.min(...sig).toFixed(3)}, ${Math.max(...sig).toFixed(3)}]`, count: sig.length })
      onSignal(sig)
    } catch (e) {
      setValidation({ ok: false, msg: e.message, count: null })
      onSignal(null)
    }
  }, [onSignal])

  const handleTextChange = (e) => {
    setTextValue(e.target.value)
    validate(e.target.value)
  }

  const handleClear = () => {
    setTextValue('')
    setValidation(null)
    onSignal(null)
    setSelectedDemo(null)
  }

  // ── File ────────────────────────────────────────────────────────────────────
  const loadFile = (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setValidation({ ok: false, msg: 'Файл слишком большой (максимум 5 МБ)', count: null }); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setTextValue(text)
      setTab('text')
      validate(text)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    loadFile(e.dataTransfer.files[0])
  }

  // ── Demo ────────────────────────────────────────────────────────────────────
  const handleDemoSelect = (demo) => {
    setSelectedDemo(demo.id)
    const sig = demoSignals[demo.id]
    const text = JSON.stringify(sig)
    setTextValue(text)
    setValidation({ ok: true, msg: `${sig.length} точек · демо-сигнал "${demo.name}"`, count: sig.length })
    onSignal(sig)
    setTab('text')
  }

  // ── Keyboard shortcut Ctrl+Enter ─────────────────────────────────────────
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && signal && !loading) {
      onPredict()
    }
  }

  const canRun = Boolean(signal) && !loading

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── Input card ── */}
      <div className="card input-card">
        {/* Header */}
        <div className="input-header">
          <span className="input-title">Входные данные ЭКГ</span>
          {validation && (
            <span className={`pt-badge ${validation.ok ? 'ok' : 'err'}`}>
              {validation.ok ? `✓ ${validation.count?.toLocaleString('ru')} точек` : '✕ ошибка'}
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="tab-bar">
          {[['text', 'Текст / JSON'], ['file', 'Файл'], ['demo', 'Демо-сигнал']].map(([id, label]) => (
            <button
              key={id}
              className={`tab-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab: text */}
        {tab === 'text' && (
          <>
            <textarea
              value={textValue}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={'JSON массив: [0.12, 0.45, 0.78, ...]\nCSV строка: 0.12, 0.45, 0.78, ...\nЧисла через пробел или новую строку'}
              spellCheck={false}
            />
            {validation && (
              <p className={`validation-hint ${validation.ok ? 'ok' : 'err'}`}>
                {validation.ok ? '✓' : '✕'} {validation.msg}
              </p>
            )}
          </>
        )}

        {/* Tab: file */}
        {tab === 'file' && (
          <div
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,.txt"
              style={{ display: 'none' }}
              onChange={(e) => { loadFile(e.target.files[0]); e.target.value = '' }}
            />
            <div className="dropzone-icon">📂</div>
            <div className="dropzone-title">Перетащите файл или нажмите для выбора</div>
            <div className="dropzone-sub">Массив чисел в любом текстовом формате</div>
            <div className="dropzone-formats">.json · .csv · .txt · до 5 МБ</div>
          </div>
        )}

        {/* Tab: demo */}
        {tab === 'demo' && (
          <div className="demo-grid">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                className={`demo-card ${selectedDemo === d.id ? 'active' : ''}`}
                onClick={() => handleDemoSelect(d)}
              >
                <div className="demo-letter" style={{ background: d.bg, color: d.color }}>
                  {d.letter}
                </div>
                <div className="demo-name">{d.name}</div>
                <div className="demo-desc">{d.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="input-footer">
          <div className="btn-group">
            <button className="btn-ghost" onClick={handleClear}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8l-.8 7H2.8L2 3zM5 3V2h2v1M1 3h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Очистить
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={onPredict}
            disabled={!canRun}
          >
            {loading ? <span className="spinner" /> : (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <polyline points="0,6.5 2.5,6.5 4,2 6.5,11 8,3.5 9.5,6.5 13,6.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
              </svg>
            )}
            {loading ? 'Анализ...' : 'Анализировать'}
          </button>
        </div>

        {validation?.ok && !loading && (
          <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '-4px' }}>
            Ctrl + Enter для быстрого запуска
          </p>
        )}
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="history-wrap fade-up">
          <div className="history-head">
            <span className="history-head-title">История анализов</span>
            <button className="btn-ghost" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={onHistoryClear}>
              Очистить
            </button>
          </div>
          <div className="history-list">
            {history.map((item, i) => (
              <div key={i} className="history-item" onClick={() => onHistoryClick(item)}>
                <span className="hi-dot" style={{ background: item.info.color }} />
                <span className="hi-cls" style={{ color: item.info.color }}>{item.info.short}</span>
                <span className="hi-label">{item.info.label}</span>
                <span className="hi-conf">{(item.confidence * 100).toFixed(1)}%</span>
                <span className="hi-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
