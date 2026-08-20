# Leitner System — Backend (Yii2 REST API)

Flashcards (Leitner box) tizimi uchun backend. API-only: `frontend/` va `mobile/`
faqat shu REST API orqali ishlaydi.

**Stack:** PHP 8.3-fpm · Yii2 2.0.55 · Nginx 1.27 · PostgreSQL 16 · firebase/php-jwt 7 — hammasi Docker'da.

---

## 1. Talab

Faqat **Docker Desktop** kerak. Windows'ga PHP, Composer yoki PostgreSQL o'rnatish **shart emas**.

Docker Desktop ishga tushirilganini tekshiring:

```bash
docker info
```

Xato bersa — Docker Desktop ilovasini oching va "Engine running" bo'lguncha kuting.

---

## 2. Birinchi ishga tushirish

```bash
# 1) .env faylini yarating
cp .env.example .env

# 2) PHP image'ini quring
docker compose build

# 3) Konteynerlarni ko'taring (php + nginx + postgres)
docker compose up -d

# 4) Composer paketlarini o'rnating (birinchi marta, ~1-2 daqiqa)
docker compose exec php composer install

# 5) Migratsiyalarni bajaring
docker compose exec php php yii migrate --interactive=0
```

Tekshirish:

```bash
curl http://localhost:8080/api/v1/health
```

Kutilgan javob:

```json
{"success":true,"data":{"status":"ok","db":true,"time":"..."},"error":null}
```

---

## 3. Kundalik buyruqlar

| Buyruq | Vazifa |
|---|---|
| `docker compose up -d` | Konteynerlarni ishga tushirish |
| `docker compose down` | To'xtatish |
| `docker compose down -v` | To'xtatish + DB ma'lumotlarini o'chirish |
| `docker compose ps` | Holatni ko'rish |
| `docker compose logs -f php` | PHP loglari |
| `docker compose logs -f nginx` | Nginx loglari |
| `docker compose exec php sh` | Konteyner ichiga kirish |
| `docker compose exec php composer require <paket>` | Paket qo'shish |
| `docker compose exec php php yii migrate/create <nom>` | Yangi migratsiya |
| `docker compose exec php php yii migrate` | Migratsiyalarni bajarish |
| `docker compose exec php php yii migrate/down 1` | Oxirgi migratsiyani qaytarish |
| `docker compose exec db psql -U leitner -d leitner` | DB konsoli |

DB'ga tashqi klient (DBeaver, TablePlus) orqali ulanish:
`host=localhost port=5433 db=leitner user=leitner password=secret`

---

## 4. API endpointlari

Barcha javoblar bir xil envelope shaklida:

```json
{ "success": true, "data": { ... }, "error": null }
```

| Metod | Yo'l | Auth | Vazifa |
|---|---|---|---|
| GET | `/api/v1/health` | — | Servis + DB holati |
| POST | `/api/v1/auth/register` | — | Ro'yxatdan o'tish |
| POST | `/api/v1/auth/login` | — | Kirish |
| POST | `/api/v1/auth/refresh` | — | Tokenni yangilash |
| POST | `/api/v1/auth/logout` | Bearer | Chiqish (refresh tokenni bekor qiladi) |
| GET | `/api/v1/auth/me` | Bearer | Joriy foydalanuvchi |
| GET | `/api/v1/decks` | Bearer | Decklar ro'yxati (sahifalangan) |
| POST | `/api/v1/decks` | Bearer | Deck yaratish |
| GET | `/api/v1/decks/{id}` | Bearer | Bitta deck |
| PUT/PATCH | `/api/v1/decks/{id}` | Bearer | Deckni tahrirlash |
| DELETE | `/api/v1/decks/{id}` | Bearer | Deckni o'chirish |
| GET | `/api/v1/decks/{id}/cards` | Bearer | Deck kartalari |
| GET | `/api/v1/decks/{id}/stats` | Bearer | Deck bo'yicha statistika |
| GET | `/api/v1/cards?deckId=N` | Bearer | Kartalar ro'yxati |
| POST | `/api/v1/cards` | Bearer | Karta yaratish (`deckId` body'da) |
| GET | `/api/v1/cards/{id}` | Bearer | Bitta karta |
| PUT/PATCH | `/api/v1/cards/{id}` | Bearer | Kartani tahrirlash |
| DELETE | `/api/v1/cards/{id}` | Bearer | Kartani o'chirish |
| GET | `/api/v1/cards/{id}/progress` | Bearer | Karta darajasi + takrorlash tarixi |
| GET | `/api/v1/reviews/due` | Bearer | Hozir takrorlash kerak bo'lgan kartalar |
| GET | `/api/v1/reviews/count` | Bearer | Takrorlash kerak bo'lganlar soni |
| POST | `/api/v1/reviews` | Bearer | Javobni yozish (`{cardId, wasCorrect}`) |
| POST | `/api/v1/reviews/reset` | Bearer | Kartani 1-darajaga qaytarish |
| GET | `/api/v1/stats` | Bearer | Umumiy statistika |

### Leitner mexanizmi

Har karta uchun daraja (1..7) va `next_review_at` saqlanadi. Javob yozilganda:

- **to'g'ri** → daraja bir pog'ona oshadi; 7-darajadan keyin `O'zlashtirilgan` (8) bo'ladi va boshqa takrorlanmaydi
- **xato** → daraja 1-ga tushadi (klassik Leitner)

Daraja bo'yicha takrorlash intervali: **0, 2, 3, 7, 15, 31, 61 kun**. Interval
javob berilgan vaqtdan boshlanadi, eski jadvaldan emas — kechikish to'planib
"takrorlash ko'chkisi" hosil qilmasligi uchun.

Hech takrorlanmagan karta darhol `due` bo'ladi, lekin progress qatori faqat
birinchi javobda yaratiladi (GET so'rovlar yozmaydi).

### Misollar

**Register**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"ali","email":"ali@test.uz","password":"secret123"}'
```

**Login**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"login":"ali","password":"secret123"}'
```

Javobda `access_token` (1 soat) va `refresh_token` (30 kun) qaytadi.

**Himoyalangan endpoint**

```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Token yangilash** (refresh token bir martalik — har yangilashda yangisi beriladi)

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refresh_token":"<refresh_token>"}'
```

---

## 5. Postman

> **Diqqat:** `postman/` fayllari repodan olib tashlangan (o'chirilgan holatda
> staged). Qaytarish uchun: `git restore --staged --worktree postman/`.
> Collection deck/card CRUD va review endpointlarini qamramaydi — qaytargandan
> keyin qo'lda to'ldirish kerak.

Tayyor collection `postman/` papkasida — qo'lda endpoint kiritish shart emas.

### Import qilish

Postman'da **Import** tugmasini bosing va ikkala faylni tanlang:

```
postman/leitner-api.postman_collection.json      ← endpointlar
postman/leitner-local.postman_environment.json   ← o'zgaruvchilar
```

So'ng o'ng yuqoridagi environment ro'yxatidan **Leitner Local** ni tanlang.

### Ishlatish

1. **Auth > Register** (yoki allaqachon ro'yxatdan o'tgan bo'lsangiz **Login**) ni yuboring
2. Tokenlar avtomatik saqlanadi — qo'lda nusxalash shart emas
3. Qolgan so'rovlar tokenni o'zi ishlatadi

Xuddi shunday **Decks > Create deck** yaratilgan deck ID sini saqlaydi, shuning uchun
View / Update / Delete darhol ishlaydi.

### Nima bor

| Papka | Ichida |
|---|---|
| Health | Servis + DB holati |
| Auth | Register, Login, Me, Refresh, Logout |
| Decks | List, Create, View, Update, Delete |
| Xato holatlari | 401, 422, 404 tekshiruvlari |

Har bir so'rovda test skripti bor — javob kodi va strukturasi avtomatik tekshiriladi.

### Terminaldan ishga tushirish (ixtiyoriy)

Butun collection'ni bir buyruq bilan sinash:

```bash
npx newman run postman/leitner-api.postman_collection.json
```

### Yangi endpoint qo'shsangiz

Postman'da so'rovni qo'shing, so'ng collection'ni eksport qilib shu fayl ustiga yozing:
**Collection > … > Export > Collection v2.1**

---

## 6. Struktura

```
leitner-system/
├── docker-compose.yml          # php + nginx + db
├── .env / .env.example
├── docker/
│   ├── php/Dockerfile          # PHP 8.3 + pdo_pgsql + composer
│   └── nginx/default.conf
├── backend/
│   ├── config/                 # web.php, console.php, db.php, params.php
│   ├── models/                 # User, RefreshToken, Deck, Card, CardProgress, ReviewHistory
│   ├── enums/                  # CardLevel, DeckDirection, UserStatus
│   ├── services/               # ReviewService (Leitner mexanizmi)
│   ├── components/             # JwtService, JwtHttpBearerAuth
│   ├── modules/api/v1/         # controllers + form modellari
│   ├── migrations/
│   └── web/index.php
├── frontend/                   # (keyinchalik)
└── mobile/                     # (keyinchalik)
```

---

## 7. Frontend / mobile qo'shish

Ikkalasi ham `leitner` tarmog'iga qo'shiladi. Masalan frontend uchun
`docker-compose.yml` ga:

```yaml
  frontend:
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm install && npm run dev -- --host"
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    networks:
      - leitner
```

Konteyner ichidan API manzili — `http://nginx/api/v1/...`,
brauzerdan esa `http://localhost:8080/api/v1/...`.

Mobile (React Native / Flutter) odatda Docker'siz ishlaydi — emulator uchun
API manzili: Android `http://10.0.2.2:8080`, iOS `http://localhost:8080`.

---

## 8. Muammolarni hal qilish

**`docker info` xato beradi** — Docker Desktop ishga tushmagan. Ilovani oching.

**Port band (8080 yoki 5433)** — `.env` da `APP_PORT` / `DB_PORT` ni o'zgartiring,
so'ng `docker compose up -d`.

**`could not translate host name "db"`** — DB konteyneri hali tayyor emas.
`docker compose ps` bilan `db` servisi `healthy` bo'lishini kuting.

**Permission xatolari (`runtime` papkasi)**

```bash
docker compose exec php chmod -R 777 runtime web/assets
```

**Vendor papkasi buzilgan**

```bash
docker compose exec php rm -rf vendor composer.lock
docker compose exec php composer install
```

**Xdebug yoqish** — `.env` da `XDEBUG_MODE=debug` qiling va
`docker compose up -d --force-recreate php`. Rejim konteyner startida entrypoint orqali yoziladi.

**Toza boshlash (DB ham o'chadi)**

```bash
docker compose down -v && docker compose up -d
docker compose exec php php yii migrate --interactive=0
```

---

## 9. Keyingi bosqich

Backend domeni tayyor: auth, deck/card CRUD va Leitner takrorlash sikli
(`card_progress`, `review_history`, `ReviewService`) ishlaydi.

Keyingi ishlar:

- **Test frameworki** — hozir avtomatik test yo'q. `CardLevel` uchun PHPUnit
  unit testlari eng arzon boshlanish nuqtasi (DB kerak emas).
- **Frontend** (7-bo'limga qarang) — `/reviews/due` → javob → `/reviews` sikli.
- **Kunlik limit / sessiya rejimi** — hozir `due` barcha yetib kelgan kartalarni
  qaytaradi, `limit` parametri bilan cheklanadi.
- **Teglar** — `tag` jadvali olib tashlangan, kerak bo'lsa qaytadan loyihalash kerak.
