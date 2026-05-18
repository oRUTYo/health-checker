# ДЗ: Final AI Release Decision

**Проект:** BeatSense — веб-приложение для автоматической классификации ЭКГ-сигналов (5 классов сердечных сокращений MIT-BIH) как инструмент предварительной оценки. Не является медицинским устройством.
**Команда:** учебный MVP, один разработчик.
**Стек:** React 18 + Vite + recharts (frontend), FastAPI + PyTorch (backend, 1D CNN inference), Docker Compose, nginx (reverse-proxy на фронте).

Студент берёт то, что уже сделал по проекту, и собирает короткое финальное решение о релизе.

Всего 5 пунктов.

---

## 1. Таблица readiness по уже сделанным частям

| Блок | Готово? | Где артефакт | Комментарий |
|------|---------|--------------|-------------|
| Requirements / acceptance criteria | yes | [specs/PRD.md](../specs/PRD.md), [specs/DoD.md](../specs/DoD.md) | PRD фиксирует KPI (Accuracy ≥ 85%, F1 ≥ 0.80, E2E ≤ 5 с, ≤ 2 шага до результата) и явный non-goal по диагнозу. DoD содержит 18 пунктов с eval-gates по AI / Backend / Frontend / E2E. |
| Data / dataset quality | yes | [specs/Data_Spec.md](../specs/Data_Spec.md), [notebooks/ecg_classification.ipynb](../notebooks/ecg_classification.ipynb) | ECG Heartbeat Categorization Dataset (MIT-BIH), 5 классов, ~187 точек/сигнал. Описаны контракты качества (MinMax-нормализация, длина 187, стратифицированный split), `min_length=2` валидация на бэке и 10..50 000 точек на фронте. |
| Experiments / baseline | yes | [notebooks/ecg_classification.ipynb](../notebooks/ecg_classification.ipynb), [ml/artifacts/](../ml/artifacts/) | 1D CNN `ECGNet` (44 229 параметров): три блока Conv1D → BN → ReLU → MaxPool, затем GAP + FC. На test-срезе MIT-BIH: Accuracy 97.6%, F1 macro 0.88, F1 weighted 0.98. SMOTE для балансировки, MinMaxScaler сериализован в `scaler.pkl`. |
| Deployment | yes | [tasks/beatsense_deployment_doc.md](beatsense_deployment_doc.md), [src/docker/docker-compose.yml](../src/docker/docker-compose.yml) | Server-side инференс через FastAPI `POST /predict`. Docker Compose поднимает backend:8000 + frontend:80 (nginx проксирует `/ping`, `/predict`). Артефакты `ecg_model.pt` / `scaler.pkl` / `meta.pkl` монтируются read-only, перечитываются lifespan'ом при рестарте. Rollback — `git checkout model-v{N-1} -- ml/artifacts/` + `docker-compose restart backend`. |
| Monitoring / retraining | partial | [tasks/beatsense_monitoring_hw7.md](beatsense_monitoring_hw7.md) | План мониторинга описан: Prometheus + Grafana (service & model dashboards), Evidently (drift), MLflow (registry), papermill в GitHub Actions для retraining. Политика retraining задокументирована (триггер: F1 macro < 0.80, 100+ исправлений, drift + падение Accuracy). На сегодня в проде наблюдение идёт только через `docker-compose logs` и `GET /ping`. |

---

## 2. Quality gates summary

Коротко указать:

**Пройдены:**
- Accuracy ≥ 85% — на test-срезе MIT-BIH достигнуто 97.6% (PRD §3, DoD §2.5).
- F1-score ≥ 0.80 — F1 macro 0.88, F1 weighted 0.98 (DoD §2.5).
- Время инференса ≤ 2–3 с — CNN 44 229 параметров на CPU укладывается с большим запасом (DoD §2.8).
- Latency API без ML < 1 с, E2E ≤ 5 с — выполнено для синхронного `/predict` на одном инстансе (PRD §3, DoD §3.13, §5.17).
- API контракт — `POST /predict` принимает `{signal: float[]}`, возвращает `{class, confidence}`; валидация Pydantic, 422 на невалидные тела (DoD §3.10–§3.12).
- Fallback при `confidence < 0.6` — реализован в `run_inference()` (`src/backend/model.py:74-75`), порог `low_conf_threshold` лежит в `meta.pkl`.
- Frontend MVP — загрузка / ручной ввод / демо-сигнал, кнопка «Анализировать», визуализация сигнала через recharts, обработка ошибок в `App.jsx` (DoD §4.14–§4.15).
- E2E сценарий «загрузить → нажать → получить результат» работает в docker-compose окружении (DoD §5.16–§5.18).
- Data contracts — длина 10..50 000 на фронте, `min_length=2` на бэке, линейный ресемпл до 187 точек через `np.interp`.
- Rollback plan — версионирование артефактов через git-теги `model-v{N}` и рестарт backend; документировано в [beatsense_deployment_doc.md §7](beatsense_deployment_doc.md).

**Не пройдены:**
- Prometheus `/metrics` через `prometheus-fastapi-instrumentator` — в зависимостях бэкенда не подключён, эндпоинт не отдаётся.
- Grafana dashboards (Service / Data / Model / Drift) — спроектированы в [beatsense_monitoring_hw7.md §6](beatsense_monitoring_hw7.md), но не развёрнуты.
- Evidently drift profiling — пайплайн K-S / PSI по `data/test/` baseline не запущен.
- MLflow Model Registry — challenger-версии нет, чекпоинты живут только в `ml/artifacts/` под git, без stage `Staging`/`Production`.
- Human Feedback Loop в UI — кнопки «Подтвердить» / «Исправить класс» в `ResultPanel.jsx` пока нет, без них нет источника ground truth для retraining.
- Retraining pipeline в CI — `papermill ecg_classification.ipynb` в GitHub Actions не настроен.

**Требуют доработки:**
- Структурное логирование `predicted_class`, `confidence`, флага fallback, длины исходного сигнала и факта ресемплинга — задумано в `run_inference()`, но сейчас уходит в обычный stdout без агрегации.
- Логирование `mean / std / min / max` сигнала до и после `scaler.transform()` — нужно как ранний индикатор drift, в коде ещё нет.
- Хранилище feedback (`feedback table` в SQLite/Postgres рядом с backend) — описано в [beatsense_monitoring_hw7.md §11](beatsense_monitoring_hw7.md), но не создано.
- Sentry для JS-ошибок фронтенда — в плане, не подключён.
- Healthcheck в `docker-compose.yml` на `/ping` — стоит включить как явный `healthcheck:` блок, сейчас uptime контролируется только косвенно.

---

## 3. Главные риски перед релизом

Минимум 3 риска:

**Риск 1 — по данным:**
Модель обучена строго на MIT-BIH, и валидации на других ЭКГ-источниках не было. При смене аппарата (другая частота дискретизации, фильтрация, шумовая характеристика) включается линейный ресемпл до 187 точек через `np.interp` — артефакты ресемплинга могут систематически искажать форму R-зубца на редких классах (1 Supraventricular, 3 Fusion), без видимых ошибок в API. Автоматический drift-детектор (Evidently, K-S тест по точкам сигнала) пока не работает в production-режиме, поэтому сдвиг распределения мы заметим только постфактум.

**Риск 2 — по модели:**
Метрики на test-срезе MIT-BIH формально перекрывают пороги DoD (Accuracy 97.6%, F1 macro 0.88), но за усреднением скрывается дисбаланс: классы `Fusion` (3) и `Supraventricular` (1) в датасете редкие, и часть качества куплена через SMOTE на обучении. На реальных, не сбалансированных через SMOTE данных F1 по этим классам может оказаться существенно ниже macro-средней. Внешней валидации (другой клинический датасет, проспективное сравнение с врачом) не было, поэтому за реальный recall по аритмическим классам пока нельзя ручаться.

**Риск 3 — по эксплуатации / monitoring / rollback:**
В проде сейчас наблюдение — это `docker-compose logs` и `GET /ping`; ни Prometheus, ни Grafana, ни Evidently не подняты. Это значит, что деградации (рост P95, перекос распределения предсказаний, рост доли fallback `"не уверен"`) обнаружатся вручную или со слов пользователя, а не алертом. Human Feedback Loop не реализован в UI, поэтому ground truth из реальных сессий не накапливается — без него политика retraining (100+ исправлений или F1 < 0.80 на свежем срезе) формально неприменима. Rollback через git-тег артефактов и рестарт контейнера задокументирован, но в реальном окружении не репетировался — есть риск, что при первом откате выяснится несовместимость `scaler.pkl` / `meta.pkl` между версиями.

---

## 4. Финальное release decision

**release approved with limitations**

---

## 5. Обоснование решения

Решение — **release approved with limitations**, потому что технические компоненты MVP готовы и проходят пороги DoD, но контур наблюдаемости и сбора обратной связи существует только на уровне документа, а не в работающем production.

**Что готово.** 1D CNN `ECGNet` обучена на MIT-BIH (Accuracy 97.6%, F1 macro 0.88, F1 weighted 0.98), артефакты `ecg_model.pt` / `scaler.pkl` / `meta.pkl` лежат в `ml/artifacts/` и подтягиваются lifespan'ом FastAPI на старте. REST-контракт `POST /predict` валидируется через Pydantic, поддерживает сигналы 10..50 000 точек с линейным ресемплом до 187, возвращает класс и confidence, при `confidence < 0.6` подменяет лейбл на `"не уверен"`. Frontend (React 18 + Vite + recharts) даёт пользователю один-два шага до результата: вставка JSON / drag&drop / демо-сигнал → «Анализировать» → класс + confidence + график сигнала. Всё это упаковано в Docker Compose с nginx-прокси, локальный E2E-сценарий укладывается в KPI ≤ 5 с. Deployment-план с git-тегами артефактов и rollback через `docker-compose restart backend` описан в [beatsense_deployment_doc.md](beatsense_deployment_doc.md).

**Что ещё не готово.** Prometheus `/metrics` не подключён, Grafana dashboards (Service / Data / Model / Drift) не развёрнуты, Evidently drift-профили не запускаются, MLflow Model Registry отсутствует — challenger-чекпоинты нигде не регистрируются. В UI нет кнопок «Подтвердить» / «Исправить класс», поэтому ground truth для retraining не накапливается, а триггер «100+ пользовательских исправлений» физически не может сработать. CI-пайплайн retraining через `papermill ecg_classification.ipynb` не написан.

**Ограничения при текущем релизе.** BeatSense применяется **только как инструмент предварительной оценки** для исследователей, студентов и врачей — окончательное решение остаётся за специалистом (PRD §1–2, §4). Область применения ограничена сигналами, похожими по характеристикам на MIT-BIH (~187 точек / 360 Гц, нормализованные амплитуды). При `confidence < 0.6` система обязана отдавать пользователю `"не уверен"` вместо класса — это поведение покрыто кодом и его нельзя отключать в учебной конфигурации. Использование в окружении с другим источником ЭКГ (другая аппаратура, частота дискретизации, шумовой профиль) требует предварительной валидации модели на репрезентативной выборке этого окружения.

**Следующий шаг.** Подключить `prometheus-fastapi-instrumentator` и поднять минимальный Service Dashboard в Grafana (P95 `/predict`, error rate, uptime); добавить в `run_inference()` структурный лог `predicted_class` / `confidence` / `is_fallback` / `original_len`; реализовать в `ResultPanel.jsx` кнопки «Подтвердить» / «Исправить класс» и таблицу `feedback` в SQLite рядом с backend; зарегистрировать текущий чекпоинт в MLflow как `Production` и прогнать rollback на git-тегах в реальном окружении; настроить `papermill ecg_classification.ipynb` в GitHub Actions, чтобы при накоплении 100+ исправлений retraining запускался по триггеру.
