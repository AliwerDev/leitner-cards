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
| `docker compose exec php php tools/seed.php --fresh` | Test ma'lumotlarini yozish |

DB'ga tashqi klient (DBeaver, TablePlus) orqali ulanish:
`host=localhost port=5433 db=leitner user=leitner password=secret`

### Test ma'lumotlari

`backend/tools/seed.php` bo'sh bazani sinash uchun to'ldiradi. Skript haqiqiy API
controllerlari orqali ishlaydi: bir xil routing, bir xil autentifikatsiya filtri,
bir xil forma validatsiyasi va bir xil JWT. Faqat nginx chetlab o'tiladi, shuning
uchun `login` va `register` uchun qo'yilgan daqiqada 5 so'rov chekloviga
tushmaydi.

```bash
docker compose exec php php tools/seed.php --fresh
```

`--fresh` avval barcha foydalanuvchilarni o'chiradi. Ularga bog'liq deck, karta,
progress va tarix yozuvlari ham o'chadi, chunki `user` jadvaliga ishora qiluvchi
har bir tashqi kalit `ON DELETE CASCADE`.

Natija: 20 foydalanuvchi, 45 deck, ~370 karta va ~2500 takrorlash. Ma'lumot
ataylab xilma-xil: Oddiy va Premium hisoblar, faol/nofaol/o'chirilgan holatlar,
bitta ham deck yaratmagan hisob, hech narsa o'rganmagan hisob, va Leitner
darajalarining 1 dan 8 gacha bo'lgan taqsimoti.

Takrorlash tarixi oxirgi 30 kunga taqsimlangan. Buning uchun skript
`ReviewService::recordAnswer()` ni aniq vaqt bilan chaqiradi — controller
chaqiradigan aynan shu metod, bir xil egalik tekshiruvi va bir xil tranzaksiya
bilan, faqat vaqt parametr sifatida beriladi. `POST /api/v1/reviews` doim
"hozir" deb javob yozadi, shuning uchun uning orqali daraja ko'tarilmaydi:
2-darajaga chiqqan karta ikki kundan keyinga rejalashtiriladi va bugun qayta
so'ralmaydi.

Kirish uchun:

| Hisob | Parol | Izoh |
|---|---|---|
| `admin` | `admin12345` | Administrator, Premium |
| `alisher` | `parol12345` | Administrator, Premium |
| `dilnoza` | `parol12345` | Premium, eng faol |
| qolganlari | `parol12345` | Oddiy foydalanuvchilar |

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
| GET | `/api/v1/decks/{id}/stats` | Bearer | Deck bo'yicha statistika |
| GET | `/api/v1/cards?deckId=N&q=matn` | Bearer | Kartalar ro'yxati; `q` old/orqa tomon bo'yicha qidiradi (255 belgigacha) |
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
| GET | `/api/v1/admin/users` | Admin | Foydalanuvchilar ro'yxati; `q`, `type`, `role`, `status`, `page`, `per-page` |
| GET | `/api/v1/admin/users/{id}` | Admin | Bitta foydalanuvchi + kvota + hisoblagichlar |
| PUT/PATCH | `/api/v1/admin/users/{id}` | Admin | `type`, `role`, `status` o'zgartirish (qismiy) |
| POST | `/api/v1/admin/users/{id}/reset-password` | Admin | Parolni tiklash + barcha seanslarni tugatish |
| DELETE | `/api/v1/admin/users/{id}` | Admin | Hisobni o'chirish (yumshoq: `status = 0`) |
| GET | `/api/v1/admin/users/{id}/stats` | Admin | Bitta foydalanuvchining o'rganish statistikasi |
| GET | `/api/v1/admin/stats` | Admin | Umumiy ko'rsatkichlar (dashboard) |

### Xatolar

Xato javoblar ham bir xil shaklda keladi:

```json
{ "success": false, "data": null,
  "error": { "code": 422, "name": "...", "message": "...", "fields": { "deckId": ["..."] } } }
```

`fields` faqat validatsiya xatolarida (422) bo'ladi. Klient bitta xato ishlovchi
yozadi: `error.fields` bo'lsa forma maydonlariga tarqatadi, bo'lmasa
`error.message` ni ko'rsatadi.

`GET /api/v1/cards` da `deckId` berilmasa ham 422 qaytadi — 400 emas.

### So'rov chekloviga oid

`POST /api/v1/auth/login` va `POST /api/v1/auth/register` nginx darajasida
cheklangan: bir IP uchun daqiqasiga 5 ta so'rov, 5 tagacha portlash ruxsat
etiladi. Limitdan oshsa nginx **429** qaytaradi. Sozlama
`docker/nginx/default.conf` faylida.

### Hisob turi va cheklovlar

Har foydalanuvchining `type` (hisob turi) va `role` ustuni bor. Cheklovlar
`UserType` enumda saqlanadi (`backend/enums/UserType.php`):

| Tur | Deck | Har deckda karta |
|---|---|---|
| Oddiy (`type=1`) | 3 | 300 |
| Premium (`type=10`) | cheklovsiz | cheklovsiz |

Limitga yetganda `POST /api/v1/decks` va `POST /api/v1/cards` **422** qaytaradi,
xabar esa aniq limitni aytadi. `GET /api/v1/auth/me` javobida `quota` bo'limi
bor — klient tugmani oldindan o'chirib qo'yishi uchun.

Kartani boshqa deckga ko'chirishda ham maqsad deck limiti tekshiriladi, aks holda
bir deckni to'ldirib qolganini boshqasiga surish bilan limitni aylanib o'tish
mumkin bo'lardi.

Turni o'zgartirish uchun (hozircha faqat DB'dan):

```bash
docker compose exec db psql -U leitner -d leitner   -c "UPDATE \"user\" SET type = 10 WHERE username = 'alisher';"
```

### Administrator

`role` (`1` = foydalanuvchi, `10` = administrator) `/api/v1/auth/me` javobida
`role`, `role_label` va `is_admin` sifatida qaytadi. Faqat so'rov yuborgan
hisobning o'zining roli ko'rinadi — boshqa foydalanuvchilarning `status` va
`role` maydonlari faqat admin endpointlarida beriladi.

Birinchi administratorni konsoldan tayinlang:

```bash
docker compose exec php php yii admin/promote alisher
docker compose exec php php yii admin/list
docker compose exec php php yii admin/demote alisher
```

`admin/demote` oxirgi faol administratorni olib tashlashdan bosh tortadi —
administratorsiz tizimni faqat SQL bilan tuzatish mumkin bo'lardi.

Rol JWT ichida saqlanmaydi. `findIdentity()` har so'rovda bazadan o'qiydi,
shuning uchun rol o'zgarishi keyingi so'rovdan kuchga kiradi va qayta kirish
talab qilinmaydi.

**Xavfsizlik cheklovlari.** Admin o'zining rolini olib tashlay olmaydi, o'z
hisobini bloklay yoki o'chira olmaydi, va tizimdagi oxirgi faol administratorni
yo'qotib bo'lmaydi. Har uchtasi ham **422** qaytaradi.

Hisobni bloklash va o'chirish yumshoq amal: `status` o'zgaradi, ma'lumot
o'chmaydi. `user` jadvaliga ishora qiluvchi har bir tashqi kalit
`ON DELETE CASCADE` bo'lgani uchun haqiqiy `DELETE` foydalanuvchining barcha
decklarini, kartalarini va takrorlash tarixini yo'q qilardi — bu esa dashboard
raqamlarini retroaktiv o'zgartirardi. Ikkala amal ham refresh tokenlarni bekor
qiladi.

Rol va holat o'zgarishlari `backend/runtime/logs/admin.log` ga yoziladi: kim,
kimga, nimani o'zgartirgani. Bu tizimdagi yagona audit izi.

**Frontend.** `/admin` sahifalari faqat administratorga ko'rinadi. Boshqa
hisoblar **404** oladi (403 emas), shuning uchun sahifaning borligi ham
oshkor bo'lmaydi. Havola faqat administratorga, foydalanuvchi menyusida
ko'rsatiladi.

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

## 5. Struktura

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
│   ├── enums/                  # CardLevel, DeckDirection, UserStatus, UserType, UserRole
│   ├── services/               # ReviewService (Leitner), QuotaService (cheklovlar)
│   ├── components/             # JwtService, JwtHttpBearerAuth
│   ├── modules/api/v1/         # controllers + form modellari
│   ├── migrations/
│   └── web/index.php
├── frontend/                   # (keyinchalik)
└── mobile/                     # (keyinchalik)
```

---

## 6. Frontend / mobile qo'shish

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

## 7. Muammolarni hal qilish

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

## 8. Keyingi bosqich

Backend domeni tayyor: auth, deck/card CRUD va Leitner takrorlash sikli
(`card_progress`, `review_history`, `ReviewService`) ishlaydi.

Keyingi ishlar:

- **Test frameworki** — hozir avtomatik test yo'q. `CardLevel` uchun PHPUnit
  unit testlari eng arzon boshlanish nuqtasi (DB kerak emas).
- **Frontend** (7-bo'limga qarang) — `/reviews/due` → javob → `/reviews` sikli.
- **Kunlik limit / sessiya rejimi** — hozir `due` barcha yetib kelgan kartalarni
  qaytaradi, `limit` parametri bilan cheklanadi.
- **Teglar** — `tag` jadvali olib tashlangan, kerak bo'lsa qaytadan loyihalash kerak.
