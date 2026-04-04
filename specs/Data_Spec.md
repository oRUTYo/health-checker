# Data Spec

## 1. Sources & Rights
- Source systems:
  - Основной источник: ECG Heartbeat Categorization Dataset (Kaggle)
  - Данные представлены в виде табличных записей ECG сигналов (heartbeat segments)

- Retention:
  - Данные хранятся бессрочно в рамках проекта (MVP)
  - Возможность удаления при переходе к production (если потребуется compliance)

- Access control:
  - Доступ только у команды разработки (AI + backend)
  - Хранение в закрытом репозитории / облачном bucket (например S3 / GDrive)

- PII handling:
  - Датасет не содержит персональных данных (анонимизирован)
  - Дополнительная обработка PII не требуется

---

## 2. Data Schema (Business Meaning)

- Field descriptions:
  - `signal`:
    - Массив чисел (длина ~187 значений)
    - Представляет один heartbeat (сегмент ECG)

  - `label`:
    - Целевая переменная (класс)
    - Значения:
      - 0 — Normal beat
      - 1 — Supraventricular ectopic beat
      - 2 — Ventricular ectopic beat
      - 3 — Fusion beat
      - 4 — Unknown beat

- Units / normalization:
  - Значения сигнала — нормализованные амплитуды ECG (без единиц)
  - Дополнительно применяем:
    - масштабирование (MinMax или StandardScaler)
    - при необходимости — сглаживание / фильтрация шума

---

## 3. Labeling (if applicable)

- Label definitions:
  - Лейблы уже предоставлены в датасете
  - Это задача классификации (multi-class classification)

- Guidelines:
  - Не изменяем оригинальные метки
  - Проверяем корректность распределения классов
  - При необходимости объединяем редкие классы (опционально для MVP)

- QA process:
  - Проверка:
    - отсутствия пропусков
    - корректности формата (длина сигналов)
  - Валидация:
    - train/test split (например 80/20)
    - стратифицированная выборка

---

## 4. Coverage & Balance

- Critical segments:
  - Нормальные ритмы (baseline)
  - Аритмии (особенно ventricular и supraventricular)

- Rare classes and minimum counts:
  - Возможен сильный дисбаланс классов
  - Минимальные требования для MVP:
    - ≥ 500 примеров на класс (если возможно)
  - Методы обработки:
    - oversampling (например SMOTE)
    - class weights при обучении

---

## 5. Versioning

- Dataset naming convention:
  - `ecg-heartbeat-v{version}`
  - Пример:
    - `ecg-heartbeat-v1-raw`
    - `ecg-heartbeat-v2-clean`
    - `ecg-heartbeat-v3-processed`

- Storage location:
  - Raw данные:
    - `/data/raw/`
  - Обработанные данные:
    - `/data/processed/`
  - Обучающие выборки:
    - `/data/train/`, `/data/test/`
  - Возможное хранение:
    - локально (для MVP)
    - или облако (S3 / GCS)
