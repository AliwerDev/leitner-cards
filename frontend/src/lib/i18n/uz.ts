/**
 * Every user-facing string in the app.
 *
 * Code, comments and identifiers are English; UI copy is Uzbek (Latin), which
 * matches the backend. Use the ASCII apostrophe (yo'q, O'zlashtirilgan), not a
 * typographic one - the backend does the same and mismatched glyphs look wrong
 * side by side.
 *
 * Reuse the backend's vocabulary: karta, daraja, takrorlash. The keys keep the
 * name "deck", because the API uses it. The Uzbek text says "to'plam".
 */
export const uz = {
  app: {
    name: "Leitner",
    tagline: "Kartalar bilan yodlash tizimi",
  },

  nav: {
    decks: "To'plamlar",
    study: "Takrorlash",
    stats: "Statistika",
    profile: "Profil",
    admin: "Boshqaruv",
    logout: "Chiqish",
    theme: "Mavzu",
    themeLight: "Yorug'",
    themeDark: "Qorong'i",
    themeSystem: "Tizim",
  },

  common: {
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    create: "Yaratish",
    close: "Yopish",
    back: "Orqaga",
    retry: "Qayta urinish",
    loading: "Yuklanmoqda...",
    search: "Qidirish",
    optional: "ixtiyoriy",
    noData: "Ma'lumot yo'q",
    unlimited: "Cheklovsiz",
    of: "/",
  },

  errors: {
    unexpected: "Kutilmagan xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.",
    network: "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.",
    rateLimited: "Juda ko'p urinish. Bir daqiqadan so'ng qayta urinib ko'ring.",
    unauthorized: "Sessiya tugadi. Qaytadan kiring.",
    notFound: "Ma'lumot topilmadi.",
    server: "Serverda xatolik. Birozdan so'ng qayta urinib ko'ring.",
    invalidCredentials: "Login yoki parol xato.",
    pageNotFound: "Sahifa topilmadi.",
    deckNotFound: "To'plam topilmadi.",
    cardNotFound: "Karta topilmadi.",
  },

  validation: {
    required: "Bu maydon to'ldirilishi shart.",
    email: "Email manzil noto'g'ri.",
    minLength: (n: number) => `Kamida ${n} ta belgi bo'lishi kerak.`,
    maxLength: (n: number) => `Ko'pi bilan ${n} ta belgi bo'lishi mumkin.`,
    usernamePattern: "Faqat harf, raqam, nuqta, chiziqcha va pastki chiziq ishlatish mumkin.",
    passwordMismatch: "Parollar mos kelmadi.",
  },

  auth: {
    loginTitle: "Hisobingizga kiring",
    loginSubtitle: "Kartalaringizni takrorlashni davom ettiring.",
    registerTitle: "Yangi hisob yarating",
    registerSubtitle: "Bir daqiqada boshlang.",
    loginField: "Foydalanuvchi nomi yoki email",
    username: "Foydalanuvchi nomi",
    email: "Email",
    password: "Parol",
    passwordConfirm: "Parolni tasdiqlang",
    loginSubmit: "Kirish",
    registerSubmit: "Ro'yxatdan o'tish",
    noAccount: "Hisobingiz yo'qmi?",
    hasAccount: "Hisobingiz bormi?",
    usernameHint: "3-64 belgi; harf, raqam, nuqta, chiziqcha va pastki chiziq.",
    passwordHint: "Kamida 8 ta belgi.",
    loggingOut: "Chiqilmoqda...",
  },

  deck: {
    title: "To'plamlar",
    one: "To'plam",
    create: "Yangi to'plam",
    edit: "To'plamni tahrirlash",
    name: "Nomi",
    description: "Tavsif",
    color: "Rang",
    direction: "Yo'nalish",
    directionFrontToBack: "Old -> Orqa",
    directionBackToFront: "Orqa -> Old",
    directionHint: "Takrorlashda kartaning qaysi tomoni birinchi ko'rsatiladi.",
    cardCount: "karta",
    empty: "Hali to'plam yo'q",
    emptyHint: "Birinchi to'plamingizni yarating va kartalar qo'shing.",
    deleteTitle: "To'plamni o'chirish",
    deleteConfirm: (name: string) =>
      `"${name}" to'plamini o'chirasizmi? Uning barcha kartalari va takrorlash tarixi ham o'chadi. Bu amalni qaytarib bo'lmaydi.`,
    startStudy: "Boshlash",
    studyCards: (n: number) => `Kartalarni o'rganish - ${n}`,
    dueCount: (n: number) => `${n} ta takrorlash kerak`,
    noDue: "Takrorlash kerak emas",
  },

  card: {
    title: "Kartalar",
    one: "Karta",
    create: "Karta qo'shish",
    edit: "Kartani tahrirlash",
    front: "Old tomoni",
    back: "Orqa tomoni",
    empty: "Bu to'plamda karta yo'q",
    emptyHint: "Birinchi kartani qo'shing.",
    searchPlaceholder: "Kartalar ichidan qidirish...",
    searchEmpty: "Qidiruv bo'yicha karta topilmadi.",
    deleteTitle: "Kartani o'chirish",
    deleteConfirm: "Bu kartani o'chirasizmi? Uning takrorlash tarixi ham o'chadi.",
    move: "Boshqa to'plamga ko'chirish",
    moveTitle: "Kartani ko'chirish",
    history: "Takrorlash tarixi",
    historyEmpty: "Bu karta hali takrorlanmagan.",
    deckFull: "To'la",

    bulkCreate: "Bir nechta qo'shish",
    bulkTitle: "Bir nechta qo'shish",
    bulkLabel: "Kartalar",
    bulkHint: "Har bir qator - bitta karta. Old va orqa tomonni | yoki : bilan ajrating.",
    bulkPlaceholder: "kitob | book\nolma : apple\nsuv | water",
    bulkReady: (n: number) => `${n} ta karta tayyor`,
    bulkInvalid: (n: number) => `${n} ta qator noto'g'ri`,
    bulkLineErrors: (lines: string) => `Quyidagi qatorlarni to'g'rilang: ${lines}`,
    bulkEmpty: "Hech bo'lmasa bitta to'g'ri qator kerak.",
    bulkTooMany: (max: number) => `Bir vaqtda ko'pi bilan ${max} ta karta qo'shish mumkin.`,
    bulkSuccess: (n: number) => `${n} ta karta qo'shildi.`,
    bulkErrorNoSeparator: "Ajratuvchi topilmadi (| yoki :).",
    bulkErrorEmptySide: "Old yoki orqa tomon bo'sh.",
  },

  study: {
    title: "Takrorlash",
    reveal: "Ko'rsatish",
    correct: "Bilaman",
    wrong: "Bilmadim",
    wrongHint: "1-darajaga qaytadi",
    resetCard: "1-darajaga qaytarish",
    exit: "Sessiyani tugatish",
    exitConfirm: "Sessiyani tugatasizmi? Yuborilmagan javoblar bo'lishi mumkin.",
    empty: "Hozircha takrorlash kerak bo'lgan karta yo'q.",
    emptyHint: "Barcha kartalar takrorlangan. Keyinroq qaytib keling.",
    deckEmpty: "Bu to'plamda karta yo'q",
    ruleTitle: "Leitner qoidasi",
    ruleBody:
      "To'g'ri javob kartani bir daraja oshiradi, xato javob esa 1-darajaga qaytaradi.",
    mastered: "O'zlashtirildi!",
    progress: (done: number, total: number) => `${done} / ${total}`,
    shortcuts: "Klaviatura",
    shortcutReveal: "Javobni ko'rsatish",
    shortcutCorrect: "Bilardim",
    shortcutWrong: "Bilmadim",
    shortcutReset: "1-darajaga qaytarish",
    shortcutExit: "Chiqish",
    shortcutHelp: "Yordam",
    summaryTitle: "Sessiya yakunlandi",
    summaryTotal: "Jami javob",
    summaryCorrect: "To'g'ri",
    summaryWrong: "Xato",
    summaryAccuracy: "Aniqlik",
    summaryMastered: "Yangi o'zlashtirilgan",
    summaryAgain: "Yana takrorlash",
    summaryMoreLeft: "Yana kartalar bor",
    backToDeck: "To'plamga qaytish",
    unsavedAnswers: (n: number) => `${n} ta javob saqlanmadi`,
    resendAnswers: "Qayta yuborish",
  },

  stats: {
    title: "Statistika",
    totalCards: "Jami karta",
    dueNow: "Takrorlash kerak",
    mastered: "O'zlashtirilgan",
    notStarted: "Boshlanmagan",
    byLevel: "Darajalar bo'yicha",
    levelCount: (n: number) => `${n} ta daraja`,
    cardsInLevel: (n: number) => `${n} ta karta`,
    levelShort: (n: number) => `${n}-daraja`,
    masteredShort: "O'zlashtirilgan",
    intervalToday: "Bugun",
    intervalDays: (n: number) => `${n} kunda`,
    reviewsToday: "Oxirgi 24 soatdagi takrorlash",
    accuracy7d: "7 kunlik aniqlik",
    allDecks: "Barcha to'plamlar",
    empty: "Hali statistika yo'q",
    emptyHint: "Birinchi takrorlash sessiyangizni boshlang.",
    reviewsTrend: "Kunlik takrorlash",
    accuracyTrend: "Aniqlik dinamikasi",
    lastNDays: (n: number) => `Oxirgi ${n} kun`,
    noReviewsYet: "Bu davrda takrorlash bo'lmagan",
    reviewsLabel: "Takrorlash",
    correctLabel: "To'g'ri",
    accuracyLabel: "Aniqlik",
    range7d: "7 kun",
    range30d: "30 kun",
    range90d: "90 kun",
    rangeLabel: "Davr",
  },

  profile: {
    title: "Profil",
    account: "Hisob",
    memberSince: "Ro'yxatdan o'tgan",
    tier: "Tarif",
    quota: "Cheklovlar",
    decksUsed: "Ishlatilgan to'plamlar",
    cardsPerDeck: "Har to'plamda karta",
    upgradeHint: "Premium hisobga o'tish uchun administrator bilan bog'laning.",
  },

  admin: {
    title: "Boshqaruv",
    dashboard: "Umumiy ko'rsatkichlar",
    users: "Foydalanuvchilar",

    // Dashboard
    usersTotal: "Jami foydalanuvchi",
    usersActive: "Faol hisoblar",
    registered30d: "30 kunda qo'shilgan",
    decksTotal: "Jami to'plam",
    cardsTotal: "Jami karta",
    cardsStarted: "O'rganish boshlangan",
    emptyDecks: "Bo'sh to'plamlar",
    reviews30d: "30 kunlik takrorlash",
    accuracy30d: "30 kunlik aniqlik",
    activeUsers30d: "30 kunda faol bo'lganlar",
    byType: "Hisob turi bo'yicha",
    byRole: "Rol bo'yicha",
    byStatus: "Holat bo'yicha",

    // List
    searchPlaceholder: "Foydalanuvchi nomi yoki email",
    filterType: "Hisob turi",
    filterRole: "Rol",
    filterStatus: "Holat",
    filterAll: "Barchasi",
    filterApply: "Qo'llash",
    filterReset: "Tozalash",
    usersCount: (n: number) => `${n} ta foydalanuvchi`,
    empty: "Foydalanuvchi topilmadi",
    emptyHint: "Qidiruv yoki filtrlarni o'zgartirib ko'ring.",
    notFound: "Foydalanuvchi topilmadi.",
    you: "Bu siz",

    // Enum labels
    typeRegular: "Oddiy",
    typePremium: "Premium",
    roleUser: "Foydalanuvchi",
    roleAdmin: "Administrator",
    statusActive: "Faol",
    statusInactive: "Nofaol",
    statusDeleted: "O'chirilgan",

    // Detail
    account: "Hisob ma'lumotlari",
    manage: "Boshqarish",
    learningStats: "O'rganish statistikasi",
    decksCount: "To'plamlar",
    cardsCount: "Kartalar",
    reviewsCount: "Takrorlashlar",
    activeSessions: "Faol seanslar",
    createdAt: "Ro'yxatdan o'tgan",
    updatedAt: "Oxirgi o'zgarish",
    openUser: "Batafsil",

    // Mutations
    editTitle: "Foydalanuvchini tahrirlash",
    editHint: "Faqat o'zgartirilgan maydonlar yuboriladi.",
    type: "Hisob turi",
    role: "Rol",
    status: "Holat",
    updated: "O'zgarishlar saqlandi.",
    revokedSessions: (n: number) =>
      n > 0 ? `${n} ta seans tugatildi.` : "Faol seans yo'q edi.",

    block: "Bloklash",
    unblock: "Blokdan chiqarish",
    blockTitle: "Foydalanuvchini bloklash",
    blockConfirm: (username: string) =>
      `"${username}" hisobini bloklaysizmi? U keyingi so'rovdan boshlab tizimga kira olmaydi.`,
    unblockTitle: "Blokdan chiqarish",
    unblockConfirm: (username: string) => `"${username}" hisobini qayta faollashtirasizmi?`,

    resetPassword: "Parolni tiklash",
    resetPasswordTitle: "Yangi parol o'rnatish",
    resetPasswordHint:
      "Yangi parolni foydalanuvchiga o'zingiz yetkazing. U hech qayerda ko'rsatilmaydi.",
    newPassword: "Yangi parol",
    passwordReset: "Parol yangilandi.",

    deleteUser: "Hisobni o'chirish",
    deleteTitle: "Hisobni o'chirish",
    // Soft delete: the backend sets status = Deleted and revokes the sessions.
    // The decks, cards and history stay in place, so the copy must not promise
    // otherwise.
    deleteConfirm: (username: string) =>
      `"${username}" hisobini o'chirasizmi? U tizimga kira olmaydi. Ma'lumotlari bazada saqlanib qoladi.`,
    deleted: "Hisob o'chirildi.",

    // Guards
    selfHint: "O'z hisobingizga bu amalni qo'llay olmaysiz.",
  },

  quota: {
    decksLabel: (used: number, max: number) => `${used} / ${max} to'plam`,
    decksUnlimited: "Cheklovsiz to'plam",
    cardsLabel: (used: number, max: number) => `${used} / ${max} karta`,
    deckLimitReached: (max: number) =>
      `To'plam limiti tugadi (${max} ta). Premium hisobda cheklov yo'q.`,
    cardLimitReached: (max: number) =>
      `Karta limiti tugadi (${max} ta). Premium hisobda cheklov yo'q.`,
    lastDeckSlot: "Oxirgi to'plam slot qoldi.",
  },
} as const;
