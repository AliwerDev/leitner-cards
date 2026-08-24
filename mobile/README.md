# Magic Memorizer — mobil ilova (Expo)

Leitner tizimining mobil klienti. Backend API'ni to'g'ridan-to'g'ri iste'mol
qiladi: `frontend/` dagi kabi server proksi yo'q.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · Expo Router · TypeScript
· TanStack Query 5 · Reanimated 4.

---

## 1. Ishga tushirish

Avval backend kerak. Repo ildizidan:

```bash
docker compose up -d db php nginx
curl http://localhost:8080/api/v1/health
```

So'ng ilovani:

```bash
cd mobile
npm install
npx expo start
```

Telefonda Expo Go ilovasini oching va terminaldagi QR kodni skanerlang.
Emulator uchun terminalda `a` (Android) yoki `i` (iOS, faqat macOS) bosing.

### API manzili

Odatda hech narsa sozlash kerak emas. `lib/api/config.ts` uni uch bosqichda
aniqlaydi:

1. `EXPO_PUBLIC_API_BASE_URL` — berilgan bo'lsa, doim ustun turadi.
2. Metro qaysi xostdan bundle uzatayotgan bo'lsa, o'sha xost va `:8080`. Bir
   Wi-Fi tarmog'idagi haqiqiy telefon shu tufayli hech qanday sozlovsiz
   ishlaydi — Metro mashinaning LAN manzilini allaqachon biladi.
3. Platforma bo'yicha standart: Android emulator `10.0.2.2`, qolgani
   `localhost`.

Qo'lda berish kerak bo'lsa, `.env` faylini yarating:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8080/api/v1
```

Test hisoblari `README.md` (ildizdagi) 3-bo'limida: `admin` / `admin12345`,
`dilnoza` / `parol12345`.

---

## 2. Buyruqlar

| Buyruq | Vazifa |
|---|---|
| `npx expo start` | Dev serverni ishga tushirish |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run check-sync` | Nusxa fayllar frontend bilan mos-mosligini tekshirish |
| `npm run sync` | Nusxa fayllarni frontend'dan qayta ko'chirish |
| `npx expo-doctor` | Paket versiyalarini tekshirish |

---

## 3. Nusxalangan fayllar — eng muhim eslatma

`mobile/` mustaqil loyiha, monorepo a'zosi emas. Shuning uchun 15 ta fayl
`frontend/src/` dan **nusxa** olingan va ikki joyda yashaydi:

```
types/api.ts            types/ui.ts
lib/api/error.ts        lib/api/envelope.ts
lib/i18n/api-errors.ts
lib/validation/{messages,zod-errors,auth,card}.ts
lib/domain/{level,limits,quota,direction,stats-range,card-parse}.ts
```

Har birining boshida `// COPIED FROM ...` sarlavhasi bor. Backend shartnomasi
o'zgarsa **ikkalasini ham** yangilash kerak. Tekshirish:

```bash
npm run check-sync
```

Bu buyruq nusxalarni bayt-baytda solishtiradi va farq topsa xato beradi.
`npm run sync` esa ularni qaytadan ko'chiradi.

Agar bu yuk og'irlik qila boshlasa, keyingi qadam — npm workspaces va
`packages/shared`. Hozir loyihada monorepo yo'q, shuning uchun nusxa olish
arzonroq yechim edi.

### Moslashtirilgan fayllar (nusxa emas — farq qilishi kutiladi)

| Fayl | Sabab |
|---|---|
| `lib/api/client.ts` | `server-only` yo'q; token SecureStore'dan; 401 qayta urinishi birlamchi yangilash yo'li |
| `lib/auth/refresh.ts` | `node:crypto` yo'q — mutex xom token bilan kalitlanadi (izohga qarang) |
| `lib/domain/format.ts` | Intl o'rniga qo'lda yozilgan sana; `formatNextReview` tuzatilgan |
| `lib/domain/deck-color.ts` | CSS o'zgaruvchisi o'rniga hex qaytaradi |
| `lib/validation/deck.ts` | `description` maydoni qo'shilgan |
| `lib/i18n/uz.ts` | Oxiriga `mobile:` bo'limi qo'shilgan |
| `lib/api/endpoints/*` | Faqat `server-only` importi olib tashlangan |

`lib/api/endpoints/*` fayllari `check-sync` ro'yxatiga kirmaydi, chunki
`server-only` importi tufayli ular bayt-baytda teng bo'la olmaydi. Backend
shartnomasi o'zgarsa bu fayllarni **qo'lda** solishtirish kerak. Masalan
`reviews.ts` dagi `ALL_DUE` va `ALL_DUE_CAP` ikki tomonda bir xil bo'lishi
shart, va `ALL_DUE_CAP` backenddagi `ReviewController::ALL_LIMIT_CAP` ni
takrorlaydi.

---

## 4. Web'dan farqlar va sabablari

**Server proksi yo'q.** Web'da har bir chaqiruv Next.js serveri orqali o'tadi,
chunki brauzer `X-Pagination-*` sarlavhalarini o'qiy olmaydi (backend
`Access-Control-Expose-Headers` qo'ymagan) va httpOnly cookie XSS'ga qarshi
kerak. Native klientda CORS majburlanmaydi, shuning uchun sarlavhalar bevosita
o'qiladi va proksi keraksiz.

**Tokenlar SecureStore'da**, cookie'da emas. Uch alohida kalit: `leitner_at`,
`leitner_rt`, `leitner_at_exp` — web'dagi cookie nomlari bilan bir xil.

**Middleware yo'q.** Web `middleware.ts` da har renderdan oldin tokenni
yangilaydi. Bu yerda uning o'rnini `lib/auth/bootstrap.ts` (sovuq ishga
tushirishda) va `client.ts` dagi 401 qayta urinishi egallaydi.

**Offline navbat.** Yuborilmagan javoblar AsyncStorage'ga yoziladi. Web ularni
faqat xotirada saqlaydi; telefonda OS ilovani ogohlantirmasdan yopadi, va
javoblarni yo'qotish ularni ikki marta sanashdan yomonroq. Batafsil izoh
`lib/utils/pending-reviews.ts` da.

**Tema — JS obyekti**, CSS o'zgaruvchilari emas. OKLCH qiymatlar
`scripts/oklch-to-hex.mjs` orqali hex'ga aylantirilib `lib/theme/palette.ts` ga
yozilgan. Rangni o'zgartirish uchun `frontend/src/app/globals.css` dagi OKLCH
qiymatini tahrirlang, `node scripts/oklch-to-hex.mjs --all` ni ishga tushiring
va natijani palette.ts ga ko'chiring.

---

## 5. Backend shartnomasidagi tuzoqlar

Bular kod ichida ham izohlangan, lekin bir joyda:

**`GET /cards/{id}/progress` yozadi.** `ReviewService::progressFor()` hali
o'rganilmagan karta uchun `card_progress` qatorini yaratadi va
`stats.not_started` ni oshiradi. Faqat aniq bosishdan chaqiring — hech qachon
ro'yxatdan yoki `prefetchQuery` dan.

**`next_review_at: null` ikki xil ma'noda.** `is_new: true` — hech
o'rganilmagan; `is_mastered: true` — o'zlashtirilgan. Faqat `is_new` ni
tekshirib ajrating. Frontend'dagi `formatNextReview` buni chalkashtiradi va
har yangi kartani "O'zlashtirilgan" deb yozadi.

**`POST /reviews` javobidagi `due_count` hisob bo'yicha umumiy**, `deckId` ni
e'tiborsiz qoldiradi. Deck bo'yicha son kerak bo'lsa
`/reviews/count?deckId=` alohida so'raladi.

**`reviews_today` va `accuracy_7d`** ham deck bo'yicha filtrlanmaydi.

**429 HTML qaytaradi.** nginx login/register uchun daqiqasiga 5 so'rov chekloviga
ega va uning javobi `text/html`. `client.ts` `.json()` dan oldin content-type
tekshiradi — buni olib tashlamang.

**Refresh token bir martalik.** Har yangilashda eskisi bekor qilinadi. Shuning
uchun `lib/auth/refresh.ts` dagi mutex bor: bir vaqtda uchta ekran 401 olsa,
mutexsiz ikkitasi allaqachon o'lgan tokenni yuboradi va foydalanuvchi tizimdan
chiqib ketadi.

---

## 6. Struktura

```
mobile/
├── app/                     # Expo Router marshrutlari
│   ├── _layout.tsx          # provayderlar + Stack.Protected darvozasi
│   ├── (auth)/              # login, register
│   ├── (tabs)/              # decks, study, stats, profile
│   └── (modals)/            # deck-form, card-form, bulk-add
├── components/  ui/ layout/ decks/ stats/ study/
├── hooks/                   # react-query o'ramlari va forma hooki
├── lib/
│   ├── api/                 # client, config, endpoints
│   ├── auth/                # storage, refresh mutex, bootstrap, context
│   ├── query/               # QueryClient va kalitlar
│   ├── domain/              # sof mantiq (asosan nusxa)
│   ├── i18n/                # uz.ts
│   ├── theme/               # palette, tokens, themes, context
│   └── utils/               # offline navbat
├── scripts/                 # sync-copied.mjs, oklch-to-hex.mjs
└── types/                   # api.ts (nusxa), ui.ts (nusxa)
```

---

## 7. Hali qilinmagan

- **Testlar yo'q** — butun repoda test freymvorki yo'q. `lib/domain/` (sof
  funksiyalar, bog'liqliksiz) eng arzon boshlanish nuqtasi.
- **Kunlik grafik** — `/stats/daily` endpointi bor va `react-native-svg`
  o'rnatilgan, lekin grafik hali chizilmagan.
- **Kartani boshqa deckga ko'chirish** — `moveCard()` endpointi tayyor, UI yo'q.
- **Kartani 1-darajaga qaytarish** — `resetCard()` tayyor, UI yo'q.
- **Karta tarixi ekrani** — `/cards/{id}/progress` (yuqoridagi ogohlantirishga
  qarang).
- **Haqiqiy qurilmada sinov** — aylanish kartasining Android'dagi holati va
  cleartext HTTP faqat o'sha yerda tekshiriladi.
