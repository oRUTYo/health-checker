FROM python:3.11-slim

WORKDIR /app

# torch CPU wheel — устанавливаем отдельно до основных зависимостей для кэширования слоя
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY backend/pyproject.toml .
RUN pip install --no-cache-dir .

COPY backend/ .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
