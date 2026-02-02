# Дневник тренировок (Fitness Diary)

Веб-приложение для планирования тренировок, ввода подходов и отслеживания прогресса.

## Стек

- **Next.js 16** + React 19
- **PostgreSQL** + Prisma ORM
- **Tailwind CSS**
- **TypeScript**

## Требования

- Node.js LTS
- Docker + Docker Compose (для локальной БД)

## Локальный запуск

### 1. Переменные окружения

```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

### 2. Запуск PostgreSQL

```bash
docker compose -f docker/docker-compose.local.yml up -d
```

### 3. Миграции и seed

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Запуск приложения

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Тестовые учётные данные

- Email: `test@fitness.app`
- Пароль: `test12345`

## Деплой на production

### 1. Подготовка

- Установите Docker на VPS (Ubuntu)
- Создайте `.env.prod`:
  - `DATABASE_URL` — строка подключения к Postgres
  - `AUTH_SECRET` — случайная строка (32+ символов)
  - `POSTGRES_PASSWORD` — пароль для БД

### 2. Запуск

```bash
git clone <repo>
cd fitnes
docker compose -f docker/docker-compose.prod.yml up -d
```

### 3. Миграции

```bash
docker compose -f docker/docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker/docker-compose.prod.yml exec app npm run db:seed
```

### 4. Reverse proxy и SSL

Настройте Caddy или nginx перед контейнером `app` (порт 3000).

## Бэкапы

Рекомендуется настроить ежедневный `pg_dump` через cron:

```bash
./scripts/backup-db.sh /path/to/backups
```

Хранить 7–14 дней, проверять восстановление раз в месяц.

## Структура проекта

```
app/
  (auth)/login/         # Страница входа
  (protected)/          # Защищённые страницы
    calendar/           # Календарь тренировок
    history/            # История тренировок
    progress/           # Графики прогресса
    session/[id]/       # Экран тренировки
  api/                  # API-роуты
components/
lib/
prisma/
  schema.prisma
  seed.ts
docker/
```

## Лицензия

MIT
