# BUSINESS LOGIC AND REST API

Этот документ описывает доменную бизнес-логику и REST API мини-приложения СПО.

## 1. Общая архитектура

Backend — NestJS-приложение, доступное на порту `PORT` (по умолчанию `4000`).

Данные хранятся в PostgreSQL через Prisma (`backend/prisma/schema.prisma`).

Аутентификация построена на cookie-сессии:

- JWT токен хранится в cookie `spo_session` (httpOnly)
- при каждом запросе с `@UseGuards(AuthGuard)` backend валидирует JWT и кладет payload в `request.user`
- контроллеры используют декоратор `@User()` для чтения `request.user`

## 2. Модель данных (Prisma)

Основные сущности:

- `User` — пользователь (роль, монеты, фон, аватар, имя)
- `Event` — мероприятие (статус, локация, описание, награда монет)
- `EventAttendee` — участие пользователя в мероприятии (подтверждение и факт начисления монет)
- `Poll` и `PollResponse` — опросы внутри мероприятий (существуют в схеме, но эндпоинты в текущем коде не показаны)
- `ShopItem` — предметы магазина (типы: `BACKGROUND`, `BADGE`, `CAT_ITEM`, `ACHIEVEMENT`)
- `UserShopItem` — владение предметами магазина пользователем
- `UserBadge` — экипированные бейджи пользователя (позиция)
- `CatConfig` — настройки “котика” пользователя (массив `equippedItems`)
- `Achievement` — достижение
- `UserAchievement` — полученные достижения пользователем
- `CoinTransaction` — транзакции начисления/передачи монет
- `Notification` — уведомления пользователю (включая чтение/нечтение)

## 3. Роли и правила доступа

В схеме есть `enum UserRole`:

- `CANDIDATE`, `FIGHTER`, `COMMANDER`, `COMMANDANT`, `EXTERNAL_COMMISSAR`, `INTERNAL_COMMISSAR`, `METHODIST`, `PRESS_CENTER_HEAD`, `COMSOSTAV`

В контроллерах есть общий набор “комсоставных” ролей (условие `isComsostav`):

- `COMSOSTAV`, `COMMANDER`, `COMMANDANT`, `EXTERNAL_COMMISSAR`, `INTERNAL_COMMISSAR`, `METHODIST`, `PRESS_CENTER_HEAD`

Доступ к ряду операций ограничивается этим набором.

## 4. Сессии и авторизация (JWT + cookie)

### 4.1. Cookie и содержимое токена

JWT подписывается алгоритмом `HS256` (используется `jose`):

- secret берется из `JWT_SECRET`, если не задано — используется fallback `fallback_secret_change_me`
- срок жизни токена: 7 дней

Payload содержит:

- `userId` — id пользователя в базе
- `vkId` — vkId пользователя
- `role` — роль пользователя

### 4.2. Endpoints авторизации

#### POST `/api/auth/vk`

Назначение: вход через VK-профиль (по факту — вход по `vkId`, без реального вызова VK).

Request body:

- `vkId: number`
- `firstName: string`
- `lastName: string`
- `avatarUrl?: string`

Бизнес-логика:

- если `User` с таким `vkId` еще нет — создается
- начальная роль:
  - в `development` при `vkId === 1` пользователь получает `role = COMMANDER` и минимум `1000` монет
  - иначе — `role = CANDIDATE` и `coins = 0`
- в dev-режиме при повторном входе для `vkId === 1` роль принудительно становится `COMMANDER`, а монеты поднимаются до минимум `1000`

Response:

- `{ user, token }`

Дополнительно:

- сервер устанавливает cookie `spo_session` со значением `token`

#### GET `/api/auth/vk`

Назначение: проверка текущей сессии.

Бизнес-логика:

- чтение `spo_session` из cookie
- валидация JWT
- поиск пользователя по `session.userId` и возврат его данных
- в dev-режиме повторно применяется логика “для vkId=1 сделать COMMANDER и поднять монеты”

#### DELETE `/api/auth/vk`

Назначение: выход.

Response:

- `{ ok: true }`

Действие:

- cookie `spo_session` очищается

## 5. Пользователи (Users)

### 5.1. GET `/api/users`

Доступ: без `AuthGuard`

Response: список пользователей, отсортированный по `coins` по убыванию.

В ответе в контроллере используется `UsersService.getAll()`:

- включает `_count: { attendances }`

### 5.2. GET `/api/users/:id`

Доступ: без `AuthGuard`

Response: “расширенная” карточка пользователя:

- `background` (связанный `ShopItem` для фона)
- `equippedBadges` (включая `item`)
- `catConfig`
- `achievements` (включая `achievement`)
- `purchases` (включая `item`)
- `attendances` с `confirmedAt != null` (берутся последние 20; в ответе только сводка по event: `id/title/dateLabel/imageUrl`)
- `organizedEvents` (последние 10, сортировка по `date desc`)
- `_count` по количеству `attendances` и `organizedEvents`

### 5.3. PATCH `/api/users/:id`

Доступ: с `AuthGuard`

Авторизация:

- разрешено либо владельцу (`currentUser.userId === id`), либо “комсоставу”

Изменяемые поля:

- если владелец: `backgroundId`, `avatarUrl`, `fullName`
- если “комсостав”: `role`, `backgroundId`, `coins`, `avatarUrl`, `fullName`

Дополнительно:

- если “комсостав” изменил `role` пользователя, создается notification:
  - `title: "Ваша роль изменена"`
  - `message: "Комсостав изменил вашу роль на: <новая роль>"`

Response:

- обновленный пользователь

### 5.4. DELETE `/api/users/:id`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Response:

- `{ ok: true }`

### 5.5. POST `/api/users/:id/coins`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Request body:

- `amount: number`
- `reason: string`

Бизнес-логика в `UsersService.addCoins()`:

- транзакцией:
  - увеличиваются `User.coins` на `amount`
  - создается `CoinTransaction` (sender = текущий userId, receiver = target userId)
  - создается `Notification` получателю:
    - `title: "Начислено <amount> монет!"`
    - `message: <reason>`

Response:

- обновленный `User`

## 6. Магазин и “котик” (Shop)

Контроллер: базовый путь `api`, поэтому endpoints: ` /api/shop`, ` /api/cat`, ` /api/shop-items`.

### 6.1. GET `/api/shop?type=...`

Доступ: без `AuthGuard`

Параметр:

- `type?: string` (ожидаются значения типа `ShopItemType`)

Response: список `ShopItem`, отсортированный по цене `price asc`.

### 6.2. POST `/api/shop`

Доступ: с `AuthGuard`

Request body:

- `itemId: string`

Бизнес-логика покупки (`ShopService.buyItem()`):

- проверяется существование пользователя и предмета
- если `item.requiresFighter === true`, роль покупателя должна входить в список:
  `FIGHTER`, `COMMANDER`, `COMMANDANT`, `EXTERNAL_COMMISSAR`, `INTERNAL_COMMISSAR`, `METHODIST`, `PRESS_CENTER_HEAD`, `COMSOSTAV`
- предмет не должен уже быть куплен пользователем (`UserShopItem` уникален по `(userId, itemId)`)
- у пользователя должно хватать монет: `user.coins >= item.price`

Транзакция покупки:

- уменьшаются монеты
- создается запись `UserShopItem`
- если предмет типа `BACKGROUND`, обновляется `User.backgroundId`
- если количество покупок пользователя достигло `>= 3`, выдается достижение:
  - `achievementId = 'ach_shopper'` через `UserAchievement.upsert`

Response:

- `{ user: updatedUser, purchase }`

### 6.3. GET `/api/cat`

Доступ: с `AuthGuard`

Response:

- `config` — `CatConfig` пользователя (включает `equippedItems`)
- `ownedCatItems` — список `UserShopItem`, где предмет типа `CAT_ITEM` (включая `item`)

### 6.4. PUT `/api/cat`

Доступ: с `AuthGuard`

Request body:

- `equippedItems: string[]` (в коде тип `any`, фактически ожидается массив)

Бизнес-логика (`updateCatConfig()`):

- `CatConfig` делается через `upsert`
- дополнительно выдается достижение `ach_cat_lover` через `UserAchievement.upsert`

Response:

- обновленная/созданная `CatConfig`

### 6.5. POST `/api/shop-items`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Request body (поля из `ShopService.createShopItem()`):

- `type` (`ShopItemType`)
- `name`
- `description?: string`
- `price: number|string`
- `icon?: string`
- `imageUrl?: string`
- `requiresFighter?: boolean`

Response: созданный `ShopItem`.

## 7. Мероприятия (Events)

Контроллер: `api/events`.

### 7.1. GET `/api/events?status=APPROVED|PENDING|REJECTED`

Доступ: без `AuthGuard`

Если `status` не указан — используется `APPROVED`.

Response:

- список событий, отсортированных по `date asc`
- включается:
  - `organizer`
  - `_count.attendances`

### 7.2. POST `/api/events`

Доступ: с `AuthGuard`

Request body (обязательные поля по текущей проверке):

- `title: string`
- `date: string|number` (в коде преобразуется в `new Date(date)`)
- `location: string`

Опциональные поля:

- `latitude?: string|number`
- `longitude?: string|number`
- `imageUrl?: string`
- `description?: string`
- `shortDescription?: string`
- `subtitle?: string`
- `dateLabel?: string`
- `pollQuestion?: string`

Бизнес-логика:

- статус создаваемого события всегда `PENDING`
- организатор = `organizerId = currentUser.userId`

Response:

- созданное событие (включая `organizer`)

Ошибки:

- при отсутствии `title/date/location` выбрасывается `Error('Missing required fields')` (в текущей реализации это может привести к `500`, т.к. нет явного `BadRequestException`)

### 7.3. GET `/api/events/:id`

Доступ: без `AuthGuard`

Response:

- событие по id
- включает:
  - `organizer`
  - `attendances` (включая `user`)
  - `_count.attendances`

### 7.4. POST `/api/events/:id/attend`

Доступ: с `AuthGuard`

Бизнес-логика (`eventsService.attend()`):

- `EventAttendee` создается/обновляется через `upsert` по `(userId, eventId)`

Response:

- запись `EventAttendee`

### 7.5. PATCH `/api/events/:id/attend`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Request body:

- `userId: string` (id участника)

Бизнес-логика (`confirmAttendance(eventId, userId, adminId)`):

- ищется `EventAttendee` по `(userId, eventId)`
- если записи нет — `Error('Attendance not found')`
- если уже начислялись монеты (`coinsAwarded === true`) — возвращается `{ ok: true, alreadyAwarded: true }`
- иначе транзакцией:
  - ставится `confirmedAt = now`, `coinsAwarded = true`
  - начисляются монеты участнику на `event.coinsReward`
  - создается `CoinTransaction` (sender = админ)
  - создается notification участнику:
    - `title: "Участие подтверждено!"`
    - `message: "Ваше участие в ... подтверждено. Вы получили ... монет!"`

Response:

- `{ ok: true, coinsAwarded }`

### 7.6. DELETE `/api/events/:id/attend`

Доступ: с `AuthGuard`

Бизнес-логика:

- удаляется запись `EventAttendee` по `(currentUser.userId, eventId)`

Response:

- `{ ok: true }`

### 7.7. POST `/api/events/:id/moderate`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Request body:

- `action: "approve" | "reject"`

Бизнес-логика (`moderateEvent()`):

- событию присваивается статус:
  - approve -> `APPROVED`
  - reject -> `REJECTED`
- создается notification организатору:
  - если approve: `🎉 Мероприятие одобрено!`
  - если reject: `Мероприятие отклонено`

Response:

- обновленное событие

## 8. Достижения (Achievements)

Контроллер: `api/achievements`.

### 8.1. GET `/api/achievements`

Доступ: без `AuthGuard`

Response:

- список `Achievement`, `orderBy: name asc`

### 8.2. POST `/api/achievements`

Доступ: с `AuthGuard`

Только “комсостав”: иначе `403 Forbidden`

Request body:

- `name: string`
- `icon: string`
- `description?: string`
- `condition?: string`

Бизнес-логика (`createAchievement()`):

- `name` и `icon` обязательны

Response:

- созданный `Achievement`

### 8.3. POST `/api/achievements/assign`

Доступ: с `AuthGuard`

Только “комсостав”

Request body:

- `userId: string`
- `achievementId: string`

Бизнес-логика (`assignAchievement()`):

- пользователь получает `UserAchievement` через `upsert` по `(userId, achievementId)`
- создается notification пользователю:
  - `title: Новое достижение: <icon> <name>!`
  - `message: Комсостав наградил вас достижением: <description>`

Response:

- запись `UserAchievement`

## 9. Бейджи (Badges) и уведомления (Notifications)

### 9.1. GET `/api/badges`

Доступ: с `AuthGuard`

Response:

- `UserBadge[]` пользователя
- включается `item`
- сортировка по `position asc`

### 9.2. POST `/api/badges`

Доступ: с `AuthGuard`

Request body:

- `itemId: string`
- `position: number`

Бизнес-логика (`equipBadge()`):

- предмет должен быть куплен пользователем (`UserShopItem` существует)
- иначе `403 Forbidden` (`Item not owned`)
- иначе выполняется `upsert` в `UserBadge`

Response:

- обновленный/созданный `UserBadge` (включая `item`)

### 9.3. DELETE `/api/badges`

Доступ: с `AuthGuard`

Request body:

- `itemId: string`

Бизнес-логика:

- удаление записи(ей) `UserBadge` по `(userId, itemId)` (через `deleteMany`)

Response:

- `{ ok: true }`

### 9.4. GET `/api/notifications`

Доступ: с `AuthGuard`

Response:

- уведомления пользователя, `createdAt desc`, `take: 30`

### 9.5. PATCH `/api/notifications`

Доступ: с `AuthGuard`

Бизнес-логика:

- все уведомления пользователя у которых `isRead = false`, помечаются как прочитанные

Response:

- `{ ok: true }`

## 10. Загрузка файлов (Upload)

Контроллер: `api/upload`.

### POST `/api/upload`

Доступ: с `AuthGuard`

Запрос:

- `multipart/form-data`
- поле файла: `file`

Бизнес-логика:

- файл сохраняется на диск в `../public/uploads`
- имя файла: `randomUUID()+ext`

Response:

- `{ url: "/uploads/<filename>" }`

## 11. Health

### GET `/api/health`

Назначение: простая проверка работоспособности.

Response:

- `{ ok: true }`

## 12. Какие переменные окружения важны

- `DATABASE_URL` — строка подключения к PostgreSQL
- `JWT_SECRET` — secret для подписи JWT (если не задан — используется fallback)
- `NODE_ENV` — режим выполнения (`development` влияет на поведение login/session)
- `PORT` — порт backend (по умолчанию `4000`)

