# Архитектура развертывания и инференса BeatSense

## 1. Описание AI-системы и её контекста

BeatSense — AI-система для анализа ECG-сигналов и классификации сердечных аномалий с использованием 1D CNN.

Система решает задачи:
- классификации ECG-сигналов;
- определения типа сердечного ритма;
- realtime inference через web-интерфейс.

Используемые классы:
- Normal
- Supraventricular
- Ventricular
- Fusion
- Unknown

Контекст использования:
- AI-assisted diagnostics;
- web-based ECG analysis;
- educational medical AI system.

Ключевые требования:
- низкая latency;
- realtime inference;
- воспроизводимый deployment;
- возможность масштабирования inference.

---

## 2. Выбор режима инференса

Выбран:
# Online Synchronous Inference

### Обоснование

| Причина | Обоснование |
|---|---|
| Низкая latency | Пользователь получает prediction сразу |
| Небольшой объём данных | ECG sample ≈ 187 значений |
| Интерактивность | ECG анализ выполняется в realtime |
| Простота deployment | Нет необходимости в очередях |

### Почему НЕ batch inference
Batch inference увеличивает latency и не подходит для интерактивного ECG-анализа.

### Почему НЕ streaming inference
ECG анализируется как завершённый сигнал, continuous telemetry отсутствует.

---

## 3. Схема inference pipeline


Frontend (React)
      ↓
POST /predict
      ↓
FastAPI Backend
      ↓
Preprocessing
      ↓
PyTorch CNN
      ↓
Prediction + Confidence
      ↓
JSON Response

---

## 4. Выбор инструментов и обоснование

| Слой             | Инструмент      | Обоснование                    |
| ---------------- | --------------- | ------------------------------ |
| Frontend         | React + Vite    | Быстрый SPA frontend           |
| Visualization    | Recharts        | ECG visualization              |
| Backend          | FastAPI         | Высокая производительность API |
| ML Framework     | PyTorch         | Поддержка CNN                  |
| Inference        | PyTorch Runtime | Простая интеграция модели      |
| Containerization | Docker          | Reproducible deployment        |
| Reverse Proxy    | nginx           | Frontend serving               |
| Orchestration    | docker-compose  | Multi-container deployment     |

---

## 5. API-контракт

### Health Check

```http
GET /ping
```

Response:

```json
{
  "status": "ok"
}
```

---

### ECG Prediction

```http
POST /predict
```

Request:

```json
{
  "signal": [0.1, 0.2, ...]
}
```

* signal содержит массив из ~187 значений ECG.

---

Response:

```json
{
  "class": "Normal",
  "confidence": 0.92
}
```

---

### Fallback Logic

Если confidence:

```text
< 0.6
```

система возвращает:

```json
{
  "class": "не уверен"
}
```

---

## 6. SLI / SLO

### Model Quality

| Метрика          | Значение |
| ---------------- | -------- |
| Accuracy         | 97.6%    |
| F1 macro         | 0.88     |
| F1 weighted      | 0.98     |
| Parameters count | 44 229   |

---

### Performance SLO

| Метрика            | Target   |
| ------------------ | -------- |
| API response time  | < 1 сек  |
| End-to-End latency | ≤ 5 сек  |
| p95 latency        | < 500 ms |
| Error rate         | < 1%     |
| API availability   | > 99%    |

---

## 7. Стратегия rollout и rollback

### Rollout

Используется Canary Deployment:

1. Новая модель разворачивается параллельно текущей;
2. Получает часть traffic;
3. Проверяются:

   * latency;
   * error rate;
   * prediction quality.

После успешной проверки модель переводится в production.

---

### Rollback

Rollback выполняется при:

* росте error rate;
* деградации latency;
* падении confidence.

Используется:

* previous model artifact;
* container restart;
* model version switching.

---

## 8. Monitoring и observability

### Monitoring Pipeline

```text
Inference Request
      ↓
Application Logs
      ↓
Metrics Collection
      ↓
Drift Detection
      ↓
Alerts
```

---

### Monitoring Targets

Система отслеживает:

* inference latency;
* API health;
* prediction distribution;
* confidence distribution;
* error rate.

---

### Drift Monitoring

Контролируются:

* Data Drift;
* Prediction Drift;
* Confidence Drift.

---

### Human Feedback Loop

Пользователь может:

* повторно отправить ECG;
* проверить результат;
* обнаружить ошибочную классификацию.

Feedback используется:

* для retraining;
* drift analysis;
* улучшения модели.

```
```
