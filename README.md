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
Frontend (React) → POST /predict → Backend (FastAPI) → ML Model (PyTorch/TF)
```

| Компонент | Директория | Статус |
|-----------|-----------|--------|
| Frontend | `frontend/` | в разработке (прототип: `BeatSense.html`) |
| Backend | `backend/` | в разработке |
| ML модель | `ml/` | в разработке |
| Notebooks | `notebooks/` | в разработке |

---

## Запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### ML обучение

```bash
cd ml
python train.py
```

---

## API

**`POST /predict`**

```json
// Запрос
{ "signal": [0.1, 0.2, ...] }

// Ответ
{ "class": "Normal", "confidence": 0.92 }
```

- Confidence < 0.6 → fallback `"не уверен"`
- Время ответа (без ML) < 1 сек, E2E ≤ 5 сек

---

## ML модель

- **Датасет:** [ECG Heartbeat Categorization Dataset](https://www.kaggle.com/datasets/shayanfazeli/heartbeat/data) (MIT-BIH), ~187 точек на сигнал
- **Задача:** мультиклассовая классификация (5 классов)
- **Целевые метрики:** Accuracy ≥ 85%, F1-score ≥ 0.80
- **Предобработка:** MinMax / StandardScaler; при дисбалансе — SMOTE или class weights
- **Формат модели:** `.pkl` или `.pt`

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
