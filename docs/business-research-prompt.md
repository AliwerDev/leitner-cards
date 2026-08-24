# Magic Memorizer — biznes tadqiqot uchun prompt

Bu fayl AI ga beriladigan tayyor prompt. Quyidagi ikki qismni (A va B) to'liq nusxalang va AI chatiga joylang.

Fayl ichida javoblar yo'q. Faqat tizim tavsifi va topshiriq bor.

---

## A QISM — TIZIM PASPORTI

> Quyidagi ma'lumotlar loyiha kodidan olingan va tekshirilgan. Ular fakt. Bu ro'yxatda yo'q narsa loyihada ham yo'q.

### 1. Mahsulot

**Nomi:** Magic Memorizer (kod ombori nomi: `leitner-system`).

**Taglayn:** "Yodlaganingiz esingizda qoladi".

**Landing sahifadagi asosiy va'da:** "Bugun nimani takrorlashni tizim hal qiladi".

Kod ichidagi izoh pozitsiyalashni ochiq aytadi: va'da — bu **rejalashtirish qarori**, kartalar emas. Sababi: kartalar har bir raqobatchida bor.

Landing sahifada uchta raqam ko'rsatiladi:
- 8 daraja
- 61 kungacha oraliq
- 0 qo'lda rejalashtirish

Landing sahifa bitta ekran: hero → 5 bosqichli yo'l → yakuniy CTA. Narx sahifasi yo'q. FAQ yo'q. Blog yo'q.

### 2. Maqsadli auditoriya

O'zbek tilida so'zlashuvchi, chet tili lug'atini yodlayotgan foydalanuvchi.

Buni ikki dalil tasdiqlaydi:
- Landing sahifadagi namuna karta so'zi: `ephemeral`.
- Ommaviy karta qo'shish maydonidagi namuna: `kitob | book`, `olma : apple`, `suv | water`.

Interfeys butunlay o'zbek (lotin) tilida.

### 3. Texnik stek

Loyiha monorepo emas. Uch mustaqil qism Docker Compose orqali birlashadi.

| Qism | Texnologiya |
|---|---|
| `backend/` | PHP 8.3, Yii2 2.0.55, Nginx 1.27, PostgreSQL 16, JWT |
| `frontend/` | Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind v4, TanStack Query |
| `mobile/` | Expo SDK 57, React Native 0.86, Expo Router, TanStack Query |

Ma'lumotlar bazasida 6 ta jadval: `user`, `refresh_token`, `deck`, `card`, `card_progress`, `review_history`. 7 ta migratsiya.

Autentifikatsiya: JWT. Access token 1 soat yashaydi. Refresh token 30 kun yashaydi va bir martalik. Parol orqali kirish. Ijtimoiy tarmoq orqali kirish yo'q.

Veb mijoz backendga to'g'ridan-to'g'ri murojaat qilmaydi. Next.js server proksi vazifasini bajaradi, tokenlar `httpOnly` cookie ichida turadi. Mobil ilova backendga to'g'ridan-to'g'ri murojaat qiladi, tokenlar `expo-secure-store` ichida turadi.

### 4. Algoritm

Klassik Leitner tizimi. 8 daraja.

| Daraja | Keyingi takrorlashgacha |
|---|---|
| 1 | 0 kun (bugun) |
| 2 | 2 kun |
| 3 | 3 kun |
| 4 | 7 kun |
| 5 | 15 kun |
| 6 | 31 kun |
| 7 | 61 kun |
| 8 (O'zlashtirilgan) | takrorlanmaydi |

Qoida:
- To'g'ri javob kartani bir daraja yuqoriga ko'taradi.
- Xato javob kartani 1-darajaga qaytaradi.
- 8-darajaga yetgan karta navbatdan butunlay chiqadi.

Baholash binar: "Bilaman" yoki "Bilmadim". Oraliq daraja yo'q.

**Bu SM-2 emas va FSRS emas.** Anki va SuperMemo ishlatadigan algoritmlar har bir foydalanuvchi va har bir karta uchun oraliqni moslashtiradi. Magic Memorizer da oraliqlar barcha uchun bir xil va o'zgarmas. Bu farqni tahlilda hisobga oling.

Oraliq javob berilgan vaqtdan hisoblanadi, eski muddatdan emas. Sababi: kechikish to'planib, bir kunda katta navbat hosil qilmasin.

### 5. Mavjud funksiyalar

**Veb (Next.js):**
- Ro'yxatdan o'tish va kirish
- To'plamlar ro'yxati, yaratish, tahrirlash, rang tanlash, yo'nalish (savol→javob yoki javob→savol)
- Kartalar: yaratish, tahrirlash, qidirish, sahifalash
- Ommaviy karta qo'shish: matnni bir marta joylash, `|` yoki `:` ajratgich, 200 qatorgacha
- Takrorlash sessiyasi: bitta to'plam bo'yicha yoki barcha to'plamlar bo'yicha
- Klaviatura qisqartmalari, sessiya yakunida natija
- Statistika: darajalar gistogrammasi, takrorlash trendi, aniqlik trendi, 7/30/90 kunlik filtr
- Profil: hisob turi, kvota ko'rsatkichi, mavzu (tungi/kunduzgi)
- Admin panel: foydalanuvchilar ro'yxati, filtrlar, hisob turini o'zgartirish, bloklash, parolni tiklash, o'chirish

**Mobil (Expo):**
- Yuqoridagilarning ko'pi
- Oflayn navbat: internet yo'q paytda berilgan javoblar qurilmada saqlanadi va ulanish tiklanganda yuboriladi
- Haptika, pull-to-refresh, oflayn banner
- Admin panel yo'q

### 6. Tarif modeli

| Tarif | To'plam | Karta (bitta to'plamda) |
|---|---|---|
| Oddiy (Regular) | 3 ta | 300 ta |
| Premium | cheksiz | cheksiz |

Limit serverda tekshiriladi. Limitdan oshsa, foydalanuvchi xato xabarini ko'radi: "To'plam limiti tugadi (3 ta). Premium hisobda cheklov yo'q."

**Premium ga o'tish qanday ishlaydi:** foydalanuvchi administrator bilan bog'lanadi. Administrator ma'lumotlar bazasida qo'lda `UPDATE` yozadi. Ilovada "Sotib olish" tugmasi yo'q.

### 7. Hozir MAVJUD BO'LMAGAN narsalar

> Bu bo'lim eng muhim. Quyidagi narsalarning **hech biri** kodda yo'q. Ularni mavjud deb hisoblamang.

**Pul:**
- Hech qanday to'lov integratsiyasi yo'q. Payme yo'q, Click yo'q, Uzum yo'q, Stripe yo'q, ilova ichidagi xarid yo'q.
- Narx yo'q, obuna yo'q, sinov muddati yo'q, chek yo'q, hisob-faktura yo'q.
- Paywall interfeysi yo'q.

**Mahsulot:**
- Sun'iy intellekt funksiyalari yo'q. Karta generatsiyasi yo'q, tarjima yo'q, ovoz (TTS) yo'q, rasm yo'q, OCR yo'q.
- Ulashish yo'q. Ommaviy to'plamlar yo'q. To'plamlar bozori yo'q.
- Import/eksport yo'q. CSV yo'q, Anki formati yo'q.
- Bildirishnoma yo'q. Push yo'q, email yo'q, eslatma yo'q.
- Streak (ketma-ket kunlar) yo'q, geymifikatsiya yo'q, reyting yo'q.
- Sinf, guruh, o'qituvchi roli, o'quvchi roli yo'q. Faqat "Foydalanuvchi" va "Administrator".
- Teglar yo'q (jadval olib tashlangan).
- Kunlik takrorlash limiti yo'q. Foydalanuvchi butun navbatni bir kunda olishi mumkin.
- Email tasdiqlash yo'q. Foydalanuvchi uchun parol tiklash yo'q (faqat admin tiklaydi).
- Google/Apple/Telegram orqali kirish yo'q.

**Til:**
- Faqat o'zbek (lotin). Bitta lug'at fayli. i18n freymvorki o'rnatilmagan. Ikkinchi til qo'shish uchun yangi qatlam yozish kerak.

**Muhandislik:**
- Testlar nol. PHPUnit yo'q, Jest yo'q, Playwright yo'q.
- CI/CD yo'q. `.github/` papkasi yo'q.
- Ishlab chiqarish (production) deploy yo'q. Faqat lokal Docker. Domen yo'q, TLS yo'q, hosting yo'q.
- Analitika yo'q. PostHog yo'q, Google Analytics yo'q, Sentry yo'q. Xato kuzatuvi yo'q.
- Mobil ilova haqiqiy qurilmada sinovdan o'tmagan. App Store yoki Google Play ga yuklanmagan.

### 8. Loyiha yoshi va resurs

- Kod hajmi: taxminan 22 000 qator.
- Tarix: 66 commit, 7 kun, 1 muallif.
- Jamoa: bitta dasturchi.
- Foydalanuvchilar: nol. Mahsulot hali chiqarilmagan.
- Byudjet: ko'rsatilmagan.

Kod sifati loyiha yoshiga nisbatan yuqori: xavfsizlik mulohazalari yozilgan, ma'lumotlar bazasi poyga holatlari hisobga olingan, dizayn tokenlari tizimi bor, uchta batafsil README bor. Lekin tijorat va operatsion tayyorlik deyarli nol.

---

## B QISM — TOPSHIRIQ

### Sizning rolingiz

Siz 15 yildan ortiq tajribaga ega biznes murabbiy va mahsulot strategisiz. Siz MDH va O'zbekiston raqamli bozorini bilasiz. Siz ta'lim texnologiyalari (EdTech) va SaaS monetizatsiyasi bo'yicha kompaniyalarga maslahat bergansiz. Siz bir necha startapning muvaffaqiyatsizligini yaqindan ko'rgansiz.

### Uslub qoidalari

Javob berishda quyidagilarga rioya qiling.

1. Xushomad qilmang. Maqtov o'rniga fakt bering.
2. Zaif joyni ochiq ayting. Yumshatmang.
3. Har bir tavsiyaga sabab qo'shing. Iloji bo'lsa raqam qo'shing.
4. Agar bilmasangiz, "bu raqamni bilmayman" deb yozing. Taxminni fakt sifatida ko'rsatmang.
5. Har bir taxmin uchun uni qanday tekshirish mumkinligini ayting.
6. Javob o'zbek tilida (lotin yozuvi) bo'lsin.
7. Umumiy gaplardan qoching. "Marketingni kuchaytiring" — bu javob emas. "Birinchi 100 foydalanuvchini qayerdan olasiz" — bu javob.

### Nima yozishingiz kerak

Quyidagi 8 bo'limni tartib bilan yozing.

#### 1. Ayovsiz baho

- Mahsulot hozir qanday holatda? Uni bir jumlada ta'riflang.
- Bu mahsulot kimga haqiqatan kerak? Kimga kerak emas?
- Eng katta 3 ta zaiflikni ayting. Har biri uchun: nima uchun bu zaiflik va u qanday oqibatga olib keladi.
- Loyihada nima yaxshi bajarilgan? Bu ustunlik bozorda ahamiyatga egami yoki faqat dasturchi uchun qadrlimi?

#### 2. Bozor

- O'zbekistonda va MDH da flashcard va til o'rganish ilovalari bozori qanday? Auditoriya hajmi qancha bo'lishi mumkin? Qanday farazlar asosida hisobladingiz?
- Raqobatchilarni solishtiring: Anki (bepul, ochiq kod, SM-2/FSRS), Quizlet, Duolingo, mahalliy loyihalar.
- Magic Memorizer bu raqobatchilardan nimasi bilan farq qiladi?
- Bu farq foydalanuvchini ko'chirish uchun **yetarlimi**? Ochiq javob bering.
- Anki bepul va kuchliroq algoritmga ega. Foydalanuvchi nima uchun Anki o'rniga buni tanlaydi? Agar ishonarli sabab bo'lmasa, buni ayting.

#### 3. Keyingi etap

Uchta stsenariy yozing. Har biri uchun 90 kunlik aniq qadamlar bering.

- **(a) Minimal yo'l** — birinchi to'lovchi mijozgacha yetish. Eng kam ish bilan.
- **(b) O'sish yo'li** — mahsulotni kengaytirish va auditoriya to'plash.
- **(c) Burilish (pivot)** — B2B yo'nalish: maktablar, o'quv markazlari, repetitorlar.

Har bir stsenariy uchun ayting: qancha vaqt, qancha pul, qanday natija kutiladi va asosiy xavf nima.

Oxirida bitta tavsiya bering: bitta dasturchi, nol foydalanuvchi va noma'lum byudjet sharoitida **qaysi yo'lni** tanlash kerak va nega.

#### 4. Monetizatsiya

- O'zbekistonda to'lov qanday qabul qilinadi? Payme, Click, Uzum — har birining integratsiya murakkabligi, komissiyasi va talablari.
- Yuridik shaxs kerakmi? YaTT yetarlimi?
- Narx qancha bo'lishi kerak? Raqam bering va nega shu raqam ekanini tushuntiring. O'zbekistondagi to'lov qobiliyatini hisobga oling.
- Hozirgi Oddiy/Premium limitlari (3 to'plam, 300 karta) to'g'rimi? Bu limit foydalanuvchini to'lovga undaydimi yoki uni ilovadan haydaydimi?
- Boshqa modellarni ko'rib chiqing: bir martalik to'lov, oylik obuna, yillik obuna, B2B litsenziya, bepul + reklama.
- Har bir model uchun ayting: shu bozorda ishlaydimi va nima uchun.

#### 5. Risklar

Risklarni to'rt guruhga ajrating. Har bir risk uchun jadval ustunlari: **risk / ehtimollik (past-o'rta-yuqori) / ta'sir / yumshatish yo'li**.

- **Texnik:** testlar yo'q, CI yo'q, ishlab chiqarish deploy yo'q, zaxira nusxa yo'q, monitoring yo'q, bitta dasturchi.
- **Bozor:** Anki bepul, talab kutilganidan past bo'lishi, foydalanuvchi qaytmasligi (retention past).
- **Huquqiy:** shaxsiy ma'lumotlar to'g'risidagi qonun (O'zbekistonda ma'lumotni mamlakat ichida saqlash talabi), soliq, ro'yxatdan o'tish, foydalanuvchi shartnomasi.
- **Operatsion:** qo'llab-quvvatlash kim tomonidan qilinadi, dasturchi kasal bo'lsa yoki charchasa nima bo'ladi, Premium ga qo'lda o'tkazish qancha foydalanuvchida ishlamay qoladi.

Eng xavfli 3 ta riskni alohida ajrating va ular ustida birinchi navbatda nima qilish kerakligini ayting.

#### 6. Harajatlar

Uchta stsenariy (3-bo'limdagi a, b, c) uchun 12 oylik harajat hisobini bering.

Quyidagilarni qamrab oling:
- Server va hosting (VPS yoki bulut)
- Domen va TLS
- Apple Developer ($99/yil) va Google Play ($25 bir martalik)
- To'lov tizimi komissiyasi
- Marketing va reklama
- Yuridik va buxgalteriya
- Dasturchi vaqti — buni **alternativ qiymat** sifatida hisoblang: agar shu vaqt ish joyida sarflansa, qancha daromad bo'lardi

Raqamlarni USD va UZS da bering. Har bir raqam ostida faraz nima ekanini yozing. Aniq narxni bilmasangiz, oraliq bering va "bu taxmin" deb belgilang.

Oxirida bitta savolga javob bering: **eng kam qancha pul bilan birinchi to'lovchi mijozga yetish mumkin?**

#### 7. Yutuqlar va o'lchov

- 6 oyda realistik natija nima? 12 oyda-chi? Optimistik emas, realistik raqam bering.
- Qaysi metrikalarni kuzatish kerak? Har biri uchun "yaxshi" chegarani ayting:
  - D1, D7, D30 retention (foydalanuvchi qaytishi)
  - Kunlik faol foydalanuvchi (DAU)
  - Bepuldan to'lovga o'tish foizi
  - Foydalanuvchi boshiga yaratilgan karta soni
  - Sessiya uzunligi va haftalik sessiya soni
- Bu metrikalarni o'lchash uchun hozir nima yo'q va uni qo'shish qancha ish?
- Muvaffaqiyat qanday ko'rinadi? Aniq raqam bilan ayting.

#### 8. Qaror nuqtalari

Aniq shartlar yozing. Har biri "agar ... bo'lsa, unda ..." shaklida bo'lsin.

Masalan: "Agar 3 oyda 100 faol foydalanuvchi to'planmasa, unda pozitsiyalashni o'zgartirish kerak."

Kamida 5 ta shart bering. Ular:
- Qachon davom etish kerak
- Qachon yo'nalishni o'zgartirish kerak
- Qachon to'xtash kerak

Oxirgi shart eng muhim. To'xtash mezonini yumshatmang.

---

### Yakuniy talab

Javob oxirida **bitta xatboshi** yozing: agar siz bu loyihaning egasi bo'lsangiz, ertaga ertalab birinchi bo'lib nima qilardingiz va nega.

---

## Promptdan qanday foydalanish

1. A va B qismlarni to'liq nusxalang.
2. AI chatiga joylang.
3. Javob aniqroq bo'lishi uchun oxiriga o'z ma'lumotlaringizni qo'shing:
   - Byudjetingiz qancha
   - Haftada necha soat vaqt ajrata olasiz
   - Sizda foydalanuvchi bormi, nechta
   - Maqsadingiz nima: daromad, tajriba, portfolio yoki asosiy ish

Bu ma'lumotlarsiz AI umumiy faraz asosida javob beradi. Ular bilan javob sizning holatingizga moslashadi.
