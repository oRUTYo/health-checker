# BeatSense — Final AI Release Decision

## 1. Readiness table

| Блок | Готово? | Где артефакт | Комментарий |
|------|--------|-------------|-------------|
| Requirements / acceptance criteria | yes | PRD / docs/requirements.md | Описаны классы аритмий, метрики (F1, recall по критичным классам), UX сценарии |
| Data / dataset quality | partial | data/ + data_report.ipynb | Есть датасет (MIT-BIH / аналог), но ограниченная репрезентативность и слабая проверка noise/artifacts |
| Experiments / baseline | yes | notebooks/experiments.ipynb | Есть baseline (CNN/LSTM), метрики посчитаны, но нет полноценного A/B и error analysis |
| Deployment | partial | backend/ + frontend/ | Есть API и веб-интерфейс, но нет полноценного production окружения (scaling, SLA) |
| Monitoring / retraining | no | draft monitoring.md | Концепция есть, но нет реальной реализации (логирование, алерты, retraining pipeline) |

---

## 2. Quality gates summary

### Пройдены:
- Requirements определены  
- Baseline модель обучена и валидирована  
- Минимальный deployment (MVP) работает  

### Не пройдены:
- Monitoring (нет продакшн-метрик)  
- Retraining pipeline  
- Полный data validation pipeline  

### Требуют доработки:
- Data quality (шум, баланс классов, real-world данные)  
- Deployment (устойчивость, latency, безопасность)  
- Model evaluation (clinical-level метрики, особенно recall по опасным аритмиям)

---

## 3. Главные риски перед релизом

### Риск по данным
Датасет (например MIT-BIH) не отражает реальные условия: шумы, артефакты, разные устройства ЭКГ.  
→ В проде модель может деградировать (data drift).

### Риск по модели
Модель может иметь хорошую общую accuracy, но:
- пропускать критические состояния (например, фибрилляцию)
- иметь нестабильный confidence  

→ Это критично из-за медицинских последствий.

### Риск по эксплуатации / monitoring / rollback
Отсутствует:
- мониторинг предсказаний  
- отслеживание drift  
- механизм rollback  

→ Деградация модели может остаться незамеченной.

---

## 4. Финальное решение

**release approved with limitations**

---

## 5. Обоснование решения

Текущая версия BeatSense готова на уровне MVP: определены требования, обучена baseline-модель и реализован базовый веб-интерфейс с API. Это позволяет использовать систему в демонстрационном или исследовательском режиме. Однако ключевые компоненты production-grade системы отсутствуют — в первую очередь мониторинг, контроль drift и pipeline переобучения. Также остаются риски по качеству данных, особенно при переходе на реальные клинические ЭКГ. Из-за этого модель пока нельзя считать надежной для медицинского применения без контроля врача. Ограничение релиза — использование только как decision-support tool, а не как автономная система диагностики. Следующий шаг — внедрение monitoring (prediction + data drift), сбор real-world данных и запуск controlled retraining pipeline.
