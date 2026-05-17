import { useState, useMemo } from 'react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip, YAxis,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
function downsample(arr, maxPts = 500) {
  if (arr.length <= maxPts) return arr
  const step = arr.length / maxPts
  return Array.from({ length: maxPts }, (_, i) => arr[Math.floor(i * step)])
}

function getViewSlice(signal, mode) {
  const n = signal.length
  if (mode === 'first')  return signal.slice(0, Math.max(10, Math.floor(n * 0.1)))
  if (mode === 'middle') return signal.slice(Math.floor(n * 0.45), Math.floor(n * 0.55))
  return signal
}

function confText(c) {
  if (c >= 0.80) return 'Высокая уверенность'
  if (c >= 0.60) return 'Средняя уверенность'
  return 'Низкая уверенность'
}

// ── Gauge (SVG arc) ───────────────────────────────────────────────────────────
function Gauge({ confidence, color }) {
  const r = 32
  const c = 2 * Math.PI * r
  const offset = c * (1 - confidence)
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.4s' }}
      />
    </svg>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
const CLASS_LEGEND = [
  { key: 'Normal',           short: 'N', color: '#2563eb', ru: 'Нормальный ритм' },
  { key: 'Supraventricular', short: 'S', color: '#b45309', ru: 'Наджелудочковая экстрасистола' },
  { key: 'Ventricular',      short: 'V', color: '#dc2626', ru: 'Желудочковая экстрасистола' },
  { key: 'Fusion',           short: 'F', color: '#7c3aed', ru: 'Сливной комплекс' },
  { key: 'Unknown',          short: 'Q', color: '#64748b', ru: 'Неизвестный класс' },
]

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '5px 10px',
      fontSize: 12,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      {payload[0].value.toFixed(4)}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultPanel({ result, signal, onReset }) {
  const [viewMode, setViewMode] = useState('full')

  const { cls, confidence, info } = result
  const confColor = confidence >= 0.8 ? '#16a34a' : confidence >= 0.6 ? '#b45309' : '#dc2626'

  const stats = useMemo(() => {
    const mn = Math.min(...signal)
    const mx = Math.max(...signal)
    return {
      pts: signal.length,
      min: mn.toFixed(4),
      max: mx.toFixed(4),
      rng: (mx - mn).toFixed(4),
    }
  }, [signal])

  const chartData = useMemo(() => {
    const slice = getViewSlice(signal, viewMode)
    return downsample(slice, 500).map((v, i) => ({ i, v }))
  }, [signal, viewMode])

  return (
    <div className="result-panel fade-up">
      {/* ── Class + Confidence ── */}
      <div className="result-grid">
        {/* Class card */}
        <div className="card class-card">
          <div
            className="class-letter"
            style={{ background: info.bg ?? '#eff6ff', color: info.color }}
          >
            {info.short}
          </div>
          <div className="class-sublabel">КЛАСС РИТМА</div>
          <div className="class-name" style={{ color: info.color }}>
            {info.label}
          </div>
          <div className="class-eng">{cls}</div>
        </div>

        {/* Confidence card */}
        <div className="card conf-card">
          <div className="conf-label">УВЕРЕННОСТЬ МОДЕЛИ</div>
          <div className="gauge-row">
            <Gauge confidence={confidence} color={confColor} />
            <div>
              <div className="gauge-pct" style={{ color: confColor }}>
                {(confidence * 100).toFixed(1)}%
              </div>
              <div className="gauge-sub">{confText(confidence)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        {[
          { val: stats.pts.toLocaleString('ru'), key: 'ТОЧЕК' },
          { val: stats.min, key: 'МИН' },
          { val: stats.max, key: 'МАКС' },
          { val: stats.rng, key: 'ДИАПАЗОН' },
        ].map(({ val, key }) => (
          <div key={key} className="card stat-card">
            <div className="stat-val">{val}</div>
            <div className="stat-key">{key}</div>
          </div>
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="card chart-card">
        <div className="chart-head">
          <span className="chart-title">ВИЗУАЛИЗАЦИЯ СИГНАЛА</span>
          <div className="view-btns">
            {[
              ['full',   'Весь'],
              ['first',  '10%'],
              ['middle', 'Середина'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`view-btn ${viewMode === id ? 'active' : ''}`}
                onClick={() => setViewMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="v"
              stroke={info.color}
              strokeWidth={1.5}
              dot={false}
              animationDuration={400}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="legend">
          {CLASS_LEGEND.map((leg) => {
            const isActive = leg.key === cls
            return (
              <div
                key={leg.key}
                className={`leg-item ${isActive ? 'active' : ''}`}
                style={isActive ? { borderColor: leg.color, color: leg.color } : {}}
              >
                <span className="leg-dot" style={{ background: leg.color }} />
                {leg.short} — {leg.ru}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="disclaimer">
        ⚠ Результаты носят информационный характер и не являются медицинским диагнозом.
        Для клинической интерпретации обратитесь к специалисту.
      </div>

      {/* ── Reset ── */}
      <button className="reset-btn" onClick={onReset}>
        Провести новый анализ
      </button>
    </div>
  )
}
