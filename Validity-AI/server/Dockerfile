FROM python:3.13-slim-bullseye

WORKDIR /app

COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000

EXPOSE 8000

CMD ["python", "server.py"]