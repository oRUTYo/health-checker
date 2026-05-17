# BeatSense

MVP веб-приложение для автоматической классификации ЭКГ-сигналов с использованием ML.

> **Дисклеймер:** Проект учебный. Не является медицинским устройством, не предназначен для постановки диагноза.

---

## Описание

BeatSense принимает сегмент ЭКГ (~187 точек) и возвращает класс сердечного ритма с оценкой уверенности. Цель — ускорить предварительный анализ кардиограмм для врачей и исследователей.

**Классы:**

| Код | Название |
|-----|----------|
| 0 | Normal beat |
| 1 | Supraventricular ectopic beat |
| 2 | Ventricular ectopic beat |
| 3 | Fusion beat |
| 4 | Unknown beat |

---

## Архитектура

```
Frontend (React) → POST /predict → Backend (FastAPI) → ML Model (PyTorch)
```

| Компонент | Директория | Статус |
|-----------|-----------|--------|
| Frontend | `src/frontend/` | реализован (React + Vite + Recharts) |
| Backend | `src/backend/` | реализован (FastAPI + ML inference) |
| ML модель | `ml/artifacts/` | обучена (1D CNN, Accuracy 97.6%, F1 macro 0.88) |
| Notebooks | `notebooks/` | реализован (EDA → обучение → оценка) |
| Pipelines | `pipelines/` | реализован (Data Flow диаграмма) |
| Docker | `src/docker/` | реализован (backend + frontend через nginx) |

---

## Запуск

### Полный стек через Docker (рекомендуется)

```bash
cd src/docker
docker-compose up --build
```

Поднимаются два сервиса:

- **Frontend** на `http://localhost` (nginx, проксирует `/ping` и `/predict` на backend)
- **Backend** на `http://localhost:8000`, Swagger UI — `http://localhost:8000/docs`

### Backend локально

```bash
cd src/backend
pip install .
uvicorn main:app --reload
```

Переменная окружения `ARTIFACTS_DIR` задаёт путь к артефактам модели (по умолчанию `/app/ml/artifacts`).

### Frontend локально

```bash
cd src/frontend
npm install
npm run dev
```

Vite dev-сервер поднимается на `http://localhost:5173`. Стек: React 18, Vite 5, Recharts (визуализация ЭКГ-сигнала).

---

## API

**`GET /ping`**

```json
{ "status": "ok" }
```

**`POST /predict`**

```json
// Запрос
{ "signal": [0.1, 0.2, ...] }  // массив из 187 чисел

// Ответ
{ "class": "Normal", "confidence": 0.92 }
```

- Confidence < 0.6 → fallback `"не уверен"`
- Время ответа (без ML) < 1 сек, E2E ≤ 5 сек

---

## ML модель

- **Датасет:** [ECG Heartbeat Categorization Dataset](https://www.kaggle.com/datasets/shayanfazeli/heartbeat/data) (MIT-BIH), ~187 точек на сигнал
- **Архитектура:** 1D CNN (три Conv1D-блока + GAP + FC), 44 229 параметров
- **Предобработка:** MinMaxScaler + SMOTE для балансировки классов
- **Результаты на test:** Accuracy 97.6%, F1 macro 0.88, F1 weighted 0.98
- **Артефакты:** `ml/artifacts/ecg_model.pt`, `scaler.pkl`, `meta.pkl`

---

## Структура данных

```
data/
├── raw/          # исходные CSV (mitbih_train.csv, mitbih_test.csv)
├── processed/    # после фильтрации и нормализации
├── train/        # обучающая выборка
└── test/         # тестовая выборка
```

Версионирование: `ecg-heartbeat-v{N}-{stage}` (например `ecg-heartbeat-v2-clean`).

---

## Спецификации

- [`specs/PRD.md`](specs/PRD.md) — требования к продукту, KPI, ограничения MVP
- [`specs/DoD.md`](specs/DoD.md) — Definition of Done для AI, Backend, Frontend и E2E
- [`specs/Data_Spec.md`](specs/Data_Spec.md) — схема данных, версионирование датасета
