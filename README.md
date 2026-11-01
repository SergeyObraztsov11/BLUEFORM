# BLUEFORM

Интернет-магазин на Nuxt и TypeScript с отдельным Express API. Переход на Express выполняется постепенно: действующие маршруты магазина пока работают в `client/server`.

## Структура

- `client/` — Nuxt, интерфейс магазина и временный сервер Nitro.
- `server/` — самостоятельный Express API на TypeScript.
- `shared/` — определения, необходимые обоим приложениям на время переноса.
- `prisma/` — общая схема и единственный набор миграций.
- `docs/API-ARCHITECTURE.md` — ответственность приложений и план миграции.
- `docs/MVP-PLAN.md` — функциональный план MVP.

## Локальный запуск

Создайте `.env` в корне на основе `.env.example` и заполните локальные значения. Нужен Docker с Compose.

```sh
docker compose --profile new-api up -d --build
```

- Магазин: http://localhost:3000
- Express API: http://localhost:3001/api/health
- Документация Express: http://localhost:3001/docs
- Проверка базы: http://localhost:3001/api/ready
- Локальные письма: http://localhost:8025

Scalar загружает браузерный скрипт с CDN и требует доступа к интернету. Проверка `health` не проверяет базу; для этого используйте `ready`.

## Проверки

Для проверок нужен Node.js 24 или новее. Установите зависимости сервера командой `npm --prefix server ci`, затем при запущенных сервисах выполните:

```sh
npm run check:server
npm run test:contract
```

Команды `npm run dev:client` и `npm run dev:server` запускают соответствующее приложение локально. Вне Docker нужно отдельно обеспечить доступ к PostgreSQL и передать необходимые переменные окружения.
