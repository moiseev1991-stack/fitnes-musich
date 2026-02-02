# Деплой на Render (бесплатно, свой домен *.onrender.com)

Проект настроен под **Render**: бесплатный Web Service + бесплатная PostgreSQL. Домен будет вида `https://fitnes.onrender.com`.

---

## Что нужно от тебя (по шагам)

### Шаг 1. Регистрация на Render

1. Открой **[render.com](https://render.com)** и нажми **Get Started**.
2. Зарегистрируйся через **GitHub** (удобнее всего — Render будет брать код из репозитория).
3. Подтверди почту, если попросят.

---

### Шаг 2. Выложить код на GitHub

Если проект ещё не в GitHub:

1. Создай репозиторий на **[github.com](https://github.com)** (например `fitnes-diary`).
2. В папке проекта выполни в терминале (подставь свой URL):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/ИМЯ_РЕПО.git
git push -u origin main
```

---

### Шаг 3. Создать сервисы из Blueprint (одна кнопка)

1. В **[Render Dashboard](https://dashboard.render.com)** нажми **New +** → **Blueprint**.
2. Подключи **GitHub** и выбери репозиторий с этим проектом.
3. Render подхватит файл **`render.yaml`** из корня и покажет:
   - базу **fitnes-db** (PostgreSQL, free);
   - сервис **fitnes** (Web Service, free).
4. Нажми **Apply** / **Create resources**.
5. Дождись создания БД и первого деплоя (5–10 минут). В логах должны пройти: `npm install` → `prisma generate` → `prisma db push` → `npm run build` → `next start`.

После деплоя ссылка на приложение будет в шапке сервиса, например:  
**`https://fitnes-xxxx.onrender.com`**.

---

### Шаг 4. (Опционально) Заполнить БД тестовым пользователем

После первого успешного деплоя можно один раз прогнать seed (тестовый пользователь + упражнения):

1. В Render открой сервис **fitnes** → вкладка **Shell** (или **Settings** → **Build & Deploy**).
2. Если есть возможность запустить команду в среде сервиса, выполни:
   ```bash
   npx prisma db seed
   ```
   Если Shell нет — можно добавить в `render.yaml` разовый **Cron Job** или выполнить seed локально, указав в `.env` **production** `DATABASE_URL` из Render (в базе **fitnes-db** → **Info** → **Internal Database URL**).  
   Тестовый логин: `test@fitness.app` / `test12345` (если не менял в `.env`).

---

## Что уже сделано в проекте

- **Prisma** переведён на **PostgreSQL** (подходит и для Render, и для локальной разработки).
- В корне добавлен **`render.yaml`**: описан бесплатный Web Service и бесплатная БД; `DATABASE_URL` и `AUTH_SECRET` подставляются автоматически.
- Сборка и запуск на Render: `npm install` → `prisma generate` → `prisma db push` → `npm run build` → `next start -p $PORT`.

---

## Локальная разработка (после перехода на PostgreSQL)

Сейчас для работы приложения нужна **PostgreSQL**. Варианты:

1. **Бесплатный облачный Postgres**  
   Зарегистрируйся на **[Neon](https://neon.tech)** или **[Supabase](https://supabase.com)**, создай базу, скопируй **connection string** в `.env` как `DATABASE_URL`. Карта не обязательна для бесплатных тарифов.

2. **Docker**  
   Если установлен Docker:
   ```bash
   docker run -d --name fitnes-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fitnes -p 5432:5432 postgres:16
   ```
   В `.env`:  
   `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fitnes"`

3. **Локальный PostgreSQL**  
   Установи Postgres и создай базу `fitnes`, укажи в `.env` свой `DATABASE_URL`.

После этого локально:

```bash
cp .env.example .env
# отредактируй .env: DATABASE_URL, AUTH_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev
```

---

## Ограничения бесплатного тарифа Render

- Сервис **засыпает** после ~15 минут без запросов; первый запрос после сна может идти 30–60 секунд (cold start).
- БД и сервис — бесплатные лимиты; для продакшена с большей нагрузкой позже можно сменить план.

---

## Если что-то пошло не так

- **Ошибка при деплое** — открой сервис **fitnes** → **Logs** и посмотри, на каком шаге падает (install, prisma, build, start).
- **«Application failed to respond»** — чаще всего сервис ещё стартует или упал на старте; проверь логи и что в **Start Command** указано: `npx next start -p $PORT`.
- **Ошибки БД** — убедись, что в Render создана база **fitnes-db** и у сервиса **fitnes** подставлена переменная **DATABASE_URL** из этой базы (при деплое через Blueprint это делается автоматически).

Если напишешь, на каком шаге застрял и что именно видишь (скрин или текст ошибки), можно разобрать точечно.
