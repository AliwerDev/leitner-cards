# Leitner — Frontend (Next.js)

Flashcards tizimi uchun klient. Backend REST API bilan ishlaydi (`../backend`).

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · zod.

## 1. Ishga tushirish

`.env.example` dan nusxa oling:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Backend ishlab turishi kerak. Root papkada:

```bash
docker compose up -d
```

Docker bilan frontend ham ko'tariladi (`http://localhost:3000`). Lokal `npm run dev` esa `http://localhost:3000` da ishlaydi va API ga `http://localhost:8080/api/v1` orqali boradi.

## 2. Arxitektura

**Server proxy.** Brauzer PHP API ga hech qachon to'g'ridan-to'g'ri murojaat qilmaydi. Barcha chaqiruvlar server komponent yoki server action orqali o'tadi:

```
Brauzer -> Next.js server -> http://nginx/api/v1
```

Sabablari:
- Token `httpOnly` cookie da. `document.cookie` orqali o'qib bo'lmaydi, ya'ni XSS token o'g'irlay olmaydi.
- `X-Pagination-*` header'larini o'qish mumkin. Backend `Access-Control-Expose-Headers` bermaydi, shuning uchun brauzer ularni ko'ra olmaydi.
- API manzili sir bo'lib qoladi. `API_BASE_URL` hech qachon `NEXT_PUBLIC_` emas.

**Token yangilash.** Refresh token bir martalik va aylanadi. Parallel render bir vaqtda yangilashga urinsa, birinchisi tokenni aylantiradi va qolganlari o'lgan token bilan qoladi. Yechim uch qismli — batafsil izoh: [src/lib/auth/refresh.ts](src/lib/auth/refresh.ts).

## 3. Dizayn tizimi

Uch qatlam, qat'iy tartibda:

1. **Primitive'lar** — `--palette-*`, `--space-*`, `--radius-*`. Xom qiymatlar.
2. **Semantik rollar** — `--color-surface`, `--color-text-muted`, `--color-accent`. Tema bo'yicha o'zgaradi. **Komponentlar faqat shularni nomlaydi.**
3. **Tailwind `@theme`** — rollarni utility class'ga bog'laydi (`bg-surface`, `text-fg-muted`).

Hammasi [src/app/globals.css](src/app/globals.css) da. **Bu — xom qiymat yozilgan yagona fayl.**

> Agar `#`, `px` yoki rang nomini yozayotgan bo'lsangiz — noto'g'ri fayldasiz. `globals.css` ga rol qo'shing.

Buni uchta mexanizm ta'minlaydi:

- **Variant-based primitive'lar** — rang/spacing class'lari faqat `components/ui/` da. Boshqa joyda `<Button variant="danger">` yoziladi, class emas.
- **Tailwind v4 `@theme`** — `--color-*` ni aniqlaganimiz uchun default palette **almashtiriladi**. `bg-gray-100` lint ogohlantirishi emas, umuman **mavjud bo'lmagan** class.
- **ESLint** — arbitrary qiymat (`p-[13px]`) va default palette (`bg-red-500`) uchun tushunarli xato beradi.

## 4. Papkalar

```
src/
├── app/
│   ├── (auth)/      login, register        — chiqib turgan holat
│   ├── (app)/       decks, study, stats, profile
│   ├── globals.css  TOKEN QATLAMI
│   └── layout.tsx
├── lib/
│   ├── api/         client, envelope, error, endpoints/
│   ├── auth/        cookies, session, refresh, actions
│   ├── actions/     server action'lar (deck, card, review)
│   ├── domain/      level, direction, deck-color, quota, format, limits
│   ├── validation/  zod sxemalari (backend qoidalarini aks ettiradi)
│   └── i18n/        uz.ts — BARCHA matn shu yerda
├── components/
│   ├── ui/          primitive'lar (Button, Field, Dialog, ...)
│   ├── layout/      app-shell, nav, theme
│   └── decks/ cards/ study/ stats/ profile/
└── types/api.ts     wire kontrakti (hech narsa import qilmaydi)
```

`types/api.ts` ataylab dependency-free — kelajakdagi mobile app uni o'zgarishsiz ishlatadi.

## 5. Til qoidasi

- Kod, comment, identifier, commit — **ingliz tilida**.
- Foydalanuvchi ko'radigan matn — **o'zbek tilida**, [src/lib/i18n/uz.ts](src/lib/i18n/uz.ts) da.
- ASCII apostrof ishlatiladi (`yo'q`, `O'zlashtirilgan`) — backend ham shunday.

## 6. Backend kontraktidagi tuzoqlar

Kod o'qib tasdiqlangan, e'tibor bering:

| Nima | Ta'siri |
|---|---|
| `GET /cards/{id}/progress` **qator yozadi** | Ro'yxatda, hover'da yoki prefetch'da chaqirmang |
| `POST /reviews` `due_count` — akkaunt bo'yicha | Sessiya progress bar'i client state'dan hisoblanadi |
| `accuracy_7d` — 0..1 nisbat | `formatAccuracy()` `* 100` qiladi |
| `reviews_today` — oxirgi 24 soat | "bugun" emas, "oxirgi 24 soat" |
| Login xatosi 401, `fields` siz | Klient xatoni parol maydoniga o'zi qo'yadi |
| Ownership xatosi 404 (403 emas) | "Deck topilmadi" deyiladi, "ruxsat yo'q" emas |
| `deck.direction` null bo'lishi mumkin | `normalizeDirection()` orqali o'tkaziladi |
| `Card` da `deck_id` yo'q | Faqat `DueCard` da bor |
| `/auth/logout` `refresh_token` siz | Barcha qurilmalarni chiqaradi — har doim token yuboriladi |
| `/auth/login` rate limit — **429 HTML** | `content-type` tekshiriladi, JSON deb o'ylanmaydi |

## 7. Buyruqlar

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint (token qoidalari bilan)
npm run typecheck  # tsc --noEmit
```
