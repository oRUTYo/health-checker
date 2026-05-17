import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import ResultPanel from './components/ResultPanel'

const CLASS_MAP = {
  'Normal':           { short: 'N', color: '#2563eb', bg: '#eff6ff', label: 'Нормальный ритм' },
  'Supraventricular': { short: 'S', color: '#b45309', bg: '#fffbeb', label: 'Наджелудочковая экстрасистола' },
  'Ventricular':      { short: 'V', color: '#dc2626', bg: '#fef2f2', label: 'Желудочковая экстрасистола' },
  'Fusion':           { short: 'F', color: '#7c3aed', bg: '#f5f3ff', label: 'Сливной комплекс' },
  'Unknown':          { short: 'Q', color: '#64748b', bg: '#f8fafc', label: 'Неизвестный класс' },
  'не уверен':        { short: '?', color: '#94a3b8', bg: '#f8fafc', label: 'Низкая уверенность' },
}

function now() {
  return new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [history, setHistory] = useState([])

  // ── Ping backend ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ping = async () => {
      try {
        const r = await fetch('/ping', { signal: AbortSignal.timeout(4000) })
        setBackendStatus(r.ok ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }
    ping()
    const id = setInterval(ping, 20000)
    return () => clearInterval(id)
  }, [])

  // ── Signal ready ─────────────────────────────────────────────────────────────
  const handleSignal = useCallback((sig) => {
    setSignal(sig)
    setResult(null)
    setApiError(null)
  }, [])

  // ── Predict ──────────────────────────────────────────────────────────────────
  const handlePredict = async () => {
    if (!signal?.length) return
    setLoading(true)
    setApiError(null)
    setResult(null)

    try {
      const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal }),
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Ошибка сервера: ${res.status}`)
      }

      const data = await res.json()
      // API returns { "class": "Normal beat", "confidence": 0.98 }
      const info = CLASS_MAP[data.class] ?? CLASS_MAP['не уверен']
      const r = { cls: data.class, confidence: data.confidence, info }

      setResult(r)
      setHistory(prev => [
        { ...r, pts: signal.length, time: now(), signal },
        ...prev,
      ].slice(0, 8))

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    } catch (e) {
      if (e.name === 'TimeoutError') {
        setApiError('Превышено время ожидания ответа от сервера (10 с). Проверьте, запущен ли бэкенд.')
      } else {
        setApiError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setSignal(null)
    setApiError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleHistoryClick = (item) => {
    setSignal(item.signal)
    setResult({ cls: item.cls, confidence: item.confidence, info: item.info })
    setApiError(null)
  }

  return (
    <div className="app">
      <Header status={backendStatus} />

      <main className="main">
        {/* ── Hero ── */}
        <div className="hero">
          <h1>Анализ ЭКГ <em>в реальном времени</em></h1>
          <p>
            Загрузите или вставьте сигнал кардиограммы (187 точек) —
            нейросеть 1D CNN классифицирует ритм за секунды
          </p>
        </div>

        {/* ── Input ── */}
        <InputPanel
          onSignal={handleSignal}
          signal={signal}
          loading={loading}
          onPredict={handlePredict}
          history={history}
          onHistoryClick={handleHistoryClick}
          onHistoryClear={() => setHistory([])}
        />

        {/* ── API error ── */}
        {apiError && (
          <div className="error-box fade-up">
            <span>⚠ {apiError}</span>
            <button className="error-box-close" onClick={() => setApiError(null)}>✕</button>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div id="results">
            <ResultPanel
              result={result}
              signal={signal}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  )
}
