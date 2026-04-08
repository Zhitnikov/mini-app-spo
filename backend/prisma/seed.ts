import {
  PrismaClient,
  UserRole,
  ShopItemType,
  EventStatus,
  CatWearSlot,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const backgrounds = await prisma.$transaction([
    prisma.shopItem.upsert({
      where: { id: 'bg_space' },
      update: { imageUrl: '/zapas/space.jpg' },
      create: {
        id: 'bg_space',
        type: ShopItemType.BACKGROUND,
        name: 'Глубокий Космос',
        description: 'Когда звёзды становятся ближе',
        price: 500,
        imageUrl: '/zapas/space.jpg',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'bg_mountains' },
      update: { imageUrl: '/zapas/mountains.webp' },
      create: {
        id: 'bg_mountains',
        type: ShopItemType.BACKGROUND,
        name: 'Снежные Пики',
        description: 'Свежесть горного воздуха',
        price: 300,
        imageUrl: '/zapas/mountains.webp',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'bg_city' },
      update: { imageUrl: '/zapas/city.jpg' },
      create: {
        id: 'bg_city',
        type: ShopItemType.BACKGROUND,
        name: 'Огни Петербурга',
        description: 'Ритм ночного города',
        price: 450,
        imageUrl: '/zapas/city.jpg',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'bg_sea' },
      update: { imageUrl: '/zapas/sea.webp' },
      create: {
        id: 'bg_sea',
        type: ShopItemType.BACKGROUND,
        name: 'Лазурный Берег',
        description: 'Шум прибоя и закатное солнце',
        price: 600,
        imageUrl: '/zapas/sea.webp',
      },
    }),
  ]);

  const badges = await prisma.$transaction([
    prisma.shopItem.upsert({
      where: { id: 'badge_star' },
      update: {},
      create: {
        id: 'badge_star',
        type: ShopItemType.BADGE,
        name: 'Звезда',
        price: 150,
        icon: '⭐',
        description: 'Светить в темноте',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'badge_planet' },
      update: {},
      create: {
        id: 'badge_planet',
        type: ShopItemType.BADGE,
        name: 'Планета',
        price: 200,
        icon: '🪐',
        description: 'Вращаться по орбите',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'badge_rocket' },
      update: {},
      create: {
        id: 'badge_rocket',
        type: ShopItemType.BADGE,
        name: 'Ракета',
        price: 250,
        icon: '🚀',
        description: 'Лети к звёздам',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'badge_comet' },
      update: {},
      create: {
        id: 'badge_comet',
        type: ShopItemType.BADGE,
        name: 'Комета',
        price: 300,
        icon: '☄️',
        description: 'Быстрее света',
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'badge_moon' },
      update: {},
      create: {
        id: 'badge_moon',
        type: ShopItemType.BADGE,
        name: 'Луна',
        price: 180,
        icon: '🌙',
        description: 'Ночной страж',
      },
    }),
  ]);

  const hatLayout = {
    anchorX: 0.5,
    anchorY: 0.12,
    widthPercent: 0.52,
    zIndex: 48,
    rotationDeg: 0,
  };
  const faceLayout = {
    anchorX: 0.5,
    anchorY: 0.3,
    widthPercent: 0.44,
    zIndex: 42,
    rotationDeg: 0,
  };
  const neckLayout = {
    anchorX: 0.5,
    anchorY: 0.4,
    widthPercent: 0.54,
    zIndex: 34,
    rotationDeg: 0,
  };
  const bodyLayout = {
    anchorX: 0.5,
    anchorY: 0.54,
    widthPercent: 0.62,
    zIndex: 24,
    rotationDeg: 0,
  };
  const feetLayout = {
    anchorX: 0.5,
    anchorY: 0.84,
    widthPercent: 0.52,
    zIndex: 20,
    rotationDeg: 0,
  };
  const tailLayout = {
    anchorX: 0.24,
    anchorY: 0.72,
    widthPercent: 0.4,
    zIndex: 10,
    rotationDeg: 0,
  };
  const backLayout = {
    anchorX: 0.38,
    anchorY: 0.5,
    widthPercent: 0.5,
    zIndex: 6,
    rotationDeg: 0,
  };
  const nebulaAccessoryLayout = {
    anchorX: 0.5,
    anchorY: 0.2,
    widthPercent: 0.52,
    zIndex: 40,
    rotationDeg: 0,
  };

  const removedCatWearIds = [
    'cat_vest',
    'cat_ear_bows',
    'cat_headband_stars',
    'cat_monocle_chic',
    'cat_shorts_chino',
    'cat_leg_warmers',
    'cat_backpack_roll',
  ];
  await prisma.userShopItem.deleteMany({
    where: { itemId: { in: removedCatWearIds } },
  });
  await prisma.shopItem.deleteMany({
    where: { id: { in: removedCatWearIds } },
  });

  /** Бывшие «скины» Lottie → предметы одежды (id те же — покупки не теряются). */
  const formerLottieAsWear = await prisma.$transaction([
    prisma.shopItem.upsert({
      where: { id: 'cat_skin_nimbus' },
      update: {
        type: ShopItemType.CAT_ITEM,
        name: 'Софиты «Студия»',
        description: 'Клапперборд за спиной',
        price: 320,
        icon: '🎬',
        catSkinLottieUrl: null,
        catWearSlot: CatWearSlot.BACK,
        catWearLayout: backLayout,
      },
      create: {
        id: 'cat_skin_nimbus',
        type: ShopItemType.CAT_ITEM,
        name: 'Софиты «Студия»',
        description: 'Клапперборд за спиной',
        price: 320,
        icon: '🎬',
        catWearSlot: CatWearSlot.BACK,
        catWearLayout: backLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_skin_stellar' },
      update: {
        type: ShopItemType.CAT_ITEM,
        name: 'Корона «Звезда»',
        description: 'Сияние над ушами',
        price: 280,
        icon: '✨',
        catSkinLottieUrl: null,
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
      create: {
        id: 'cat_skin_stellar',
        type: ShopItemType.CAT_ITEM,
        name: 'Корона «Звезда»',
        description: 'Сияние над ушами',
        price: 280,
        icon: '✨',
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_skin_aurora' },
      update: {
        type: ShopItemType.CAT_ITEM,
        name: 'Лента «Аврора»',
        description: 'Северное сияние на шее',
        price: 340,
        icon: '🌌',
        catSkinLottieUrl: null,
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
      create: {
        id: 'cat_skin_aurora',
        type: ShopItemType.CAT_ITEM,
        name: 'Лента «Аврора»',
        description: 'Северное сияние на шее',
        price: 340,
        icon: '🌌',
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_skin_nebula' },
      update: {
        type: ShopItemType.CAT_ITEM,
        name: 'Ореол «Туманность»',
        description: 'Космическое сияние вокруг головы',
        price: 300,
        icon: '🌠',
        catSkinLottieUrl: null,
        catWearSlot: CatWearSlot.ACCESSORY,
        catWearLayout: nebulaAccessoryLayout,
      },
      create: {
        id: 'cat_skin_nebula',
        type: ShopItemType.CAT_ITEM,
        name: 'Ореол «Туманность»',
        description: 'Космическое сияние вокруг головы',
        price: 300,
        icon: '🌠',
        catWearSlot: CatWearSlot.ACCESSORY,
        catWearLayout: nebulaAccessoryLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_skin_comet' },
      update: {
        type: ShopItemType.CAT_ITEM,
        name: 'Шлейф «Комета»',
        description: 'Яркий след на хвосте',
        price: 260,
        icon: '☄️',
        catSkinLottieUrl: null,
        catWearSlot: CatWearSlot.TAIL,
        catWearLayout: tailLayout,
      },
      create: {
        id: 'cat_skin_comet',
        type: ShopItemType.CAT_ITEM,
        name: 'Шлейф «Комета»',
        description: 'Яркий след на хвосте',
        price: 260,
        icon: '☄️',
        catWearSlot: CatWearSlot.TAIL,
        catWearLayout: tailLayout,
      },
    }),
  ]);

  await prisma.catConfig.updateMany({
    where: {
      equippedCatSkinId: {
        in: [
          'cat_skin_nimbus',
          'cat_skin_stellar',
          'cat_skin_aurora',
          'cat_skin_nebula',
          'cat_skin_comet',
        ],
      },
    },
    data: { equippedCatSkinId: 'cat_skin_default' },
  });

  const catItems = await prisma.$transaction([
    prisma.shopItem.upsert({
      where: { id: 'cat_hat' },
      update: {
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
      create: {
        id: 'cat_hat',
        type: ShopItemType.CAT_ITEM,
        name: 'Шляпа',
        price: 100,
        icon: '🎩',
        description: 'Элегантная шляпа для Олега',
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_glasses' },
      update: {
        catWearSlot: CatWearSlot.FACE,
        catWearLayout: faceLayout,
      },
      create: {
        id: 'cat_glasses',
        type: ShopItemType.CAT_ITEM,
        name: 'Очки',
        price: 120,
        icon: '👓',
        description: 'Умные очки для умного кота',
        catWearSlot: CatWearSlot.FACE,
        catWearLayout: faceLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_scarf' },
      update: {
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
      create: {
        id: 'cat_scarf',
        type: ShopItemType.CAT_ITEM,
        name: 'Шарф',
        price: 80,
        icon: '🧣',
        description: 'Тёплый шарф',
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_beret' },
      update: {
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
      create: {
        id: 'cat_beret',
        type: ShopItemType.CAT_ITEM,
        name: 'Берет СО',
        price: 200,
        icon: '🪖',
        description: 'Отрядный берет',
        requiresFighter: true,
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_crown_gold' },
      update: { catWearSlot: CatWearSlot.HAT, catWearLayout: hatLayout },
      create: {
        id: 'cat_crown_gold',
        type: ShopItemType.CAT_ITEM,
        name: 'Золотая корона',
        price: 280,
        icon: '👑',
        description: 'Королевский статус Олега',
        catWearSlot: CatWearSlot.HAT,
        catWearLayout: hatLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_bowtie_velvet' },
      update: { catWearSlot: CatWearSlot.NECK, catWearLayout: neckLayout },
      create: {
        id: 'cat_bowtie_velvet',
        type: ShopItemType.CAT_ITEM,
        name: 'Бархатная бабочка',
        price: 110,
        icon: '🎀',
        description: 'Вечерний выход',
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_pearl_necklace' },
      update: { catWearSlot: CatWearSlot.NECK, catWearLayout: neckLayout },
      create: {
        id: 'cat_pearl_necklace',
        type: ShopItemType.CAT_ITEM,
        name: 'Жемчужное колье',
        price: 260,
        icon: '📿',
        description: 'Элегантность и блеск',
        catWearSlot: CatWearSlot.NECK,
        catWearLayout: neckLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_hoodie_zip' },
      update: { catWearSlot: CatWearSlot.BODY, catWearLayout: bodyLayout },
      create: {
        id: 'cat_hoodie_zip',
        type: ShopItemType.CAT_ITEM,
        name: 'Худи на молнии',
        price: 190,
        icon: '🧥',
        description: 'Уютный стритстайл',
        catWearSlot: CatWearSlot.BODY,
        catWearLayout: bodyLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_denim_jacket' },
      update: { catWearSlot: CatWearSlot.BODY, catWearLayout: bodyLayout },
      create: {
        id: 'cat_denim_jacket',
        type: ShopItemType.CAT_ITEM,
        name: 'Джинсовая куртка',
        price: 210,
        icon: '👔',
        description: 'Классика casual',
        catWearSlot: CatWearSlot.BODY,
        catWearLayout: bodyLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_sneakers_hi' },
      update: { catWearSlot: CatWearSlot.FEET, catWearLayout: feetLayout },
      create: {
        id: 'cat_sneakers_hi',
        type: ShopItemType.CAT_ITEM,
        name: 'Хайтопы',
        price: 170,
        icon: '👟',
        description: 'Удобные кроссовки',
        catWearSlot: CatWearSlot.FEET,
        catWearLayout: feetLayout,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_boots_combat' },
      update: { catWearSlot: CatWearSlot.FEET, catWearLayout: feetLayout },
      create: {
        id: 'cat_boots_combat',
        type: ShopItemType.CAT_ITEM,
        name: 'Берцы',
        price: 240,
        icon: '🥾',
        description: 'Серьёзная походка',
        catWearSlot: CatWearSlot.FEET,
        catWearLayout: feetLayout,
        requiresFighter: true,
      },
    }),
    prisma.shopItem.upsert({
      where: { id: 'cat_tail_ribbon' },
      update: { catWearSlot: CatWearSlot.TAIL, catWearLayout: tailLayout },
      create: {
        id: 'cat_tail_ribbon',
        type: ShopItemType.CAT_ITEM,
        name: 'Бант на хвосте',
        price: 85,
        icon: '🎀',
        description: 'Акцент на хвостике',
        catWearSlot: CatWearSlot.TAIL,
        catWearLayout: tailLayout,
      },
    }),
  ]);

  await prisma.$transaction([
    prisma.achievement.upsert({
      where: { id: 'ach_first_event' },
      update: {},
      create: {
        id: 'ach_first_event',
        name: 'Первый шаг',
        description: 'Посетил первое мероприятие',
        icon: '👣',
        condition: 'Посетить 1 мероприятие',
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'ach_five_events' },
      update: {},
      create: {
        id: 'ach_five_events',
        name: 'Активист',
        description: 'Посетил 5 мероприятий',
        icon: '🏅',
        condition: 'Посетить 5 мероприятий',
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'ach_organizer' },
      update: {},
      create: {
        id: 'ach_organizer',
        name: 'Организатор',
        description: 'Организовал мероприятие',
        icon: '📋',
        condition: 'Организовать 1 мероприятие',
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'ach_rich' },
      update: {},
      create: {
        id: 'ach_rich',
        name: 'Богатей',
        description: 'Накопил 1000 монет',
        icon: '💰',
        condition: 'Иметь 1000 монет',
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'ach_shopper' },
      update: {},
      create: {
        id: 'ach_shopper',
        name: 'Шопоголик',
        description: 'Купил 3 предмета в магазине',
        icon: '🛍️',
        condition: 'Купить 3 предмета',
      },
    }),
    prisma.achievement.upsert({
      where: { id: 'ach_cat_lover' },
      update: {},
      create: {
        id: 'ach_cat_lover',
        name: 'Любитель котов',
        description: 'Надел Олегу первый предмет',
        icon: '🐱',
        condition: 'Купить предмет для кота',
      },
    }),
  ]);

  const demoCommissar = await prisma.user.upsert({
    where: { vkId: 1 },
    update: {},
    create: {
      vkId: 1,
      fullName: 'Иван Комиссаров',
      firstName: 'Иван',
      lastName: 'Комиссаров',
      role: UserRole.COMSOSTAV,
      coins: 9999,
      avatarUrl: 'https://placehold.co/160x160/6366f1/white?text=ИК',
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_spb_1' },
    update: {
      latitude: 59.9242,
      longitude: 30.2408,
      status: EventStatus.APPROVED,
    },
    create: {
      id: 'event_spb_1',
      title: 'Балтийский Вечер',
      subtitle: 'СПб, Набережная',
      shortDescription: 'Атмосферная встреча бойцов на берегу Финского залива.',
      description:
        'Мы собираемся в Севкабель Порту, чтобы проводить закат под звуки гитары.',
      date: new Date('2025-12-12T18:00:00'),
      dateLabel: '12 декабря, 18:00',
      location: 'Санкт-Петербург, Севкабель Порт',
      latitude: 59.9242,
      longitude: 30.2408,
      imageUrl: 'https://placehold.co/800x600/334155/white?text=Sevcabel+Port',
      pollQuestion: 'Придёшь на набережную?',
      status: EventStatus.APPROVED,
      coinsReward: 150,
      organizerId: demoCommissar.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_spb_2' },
    update: {
      latitude: 59.9575,
      longitude: 30.3082,
      status: EventStatus.APPROVED,
      dateLabel: '20 декабря, 16:00',
      location: 'Санкт-Петербург, Кронверкский пр. 49',
    },
    create: {
      id: 'event_spb_2',
      title: 'Лекция в ИТМО',
      subtitle: 'Центр знаний',
      shortDescription:
        'Мастер-класс по управлению проектами для командиров и комиссаров.',
      description: 'Погружаемся в современный проектный менеджмент.',
      date: new Date('2025-12-20T16:00:00'),
      dateLabel: '20 декабря, 16:00',
      location: 'Санкт-Петербург, Кронверкский пр. 49',
      latitude: 59.9575,
      longitude: 30.3082,
      imageUrl: 'https://placehold.co/800x600/1e293b/white?text=ITMO+Lecture',
      pollQuestion: 'Хочешь прокачать навыки управления?',
      status: EventStatus.APPROVED,
      coinsReward: 100,
      organizerId: demoCommissar.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_spb_3' },
    update: {
      latitude: 59.9723,
      longitude: 30.2494,
      status: EventStatus.APPROVED,
      dateLabel: '25 декабря, 10:00',
      location: 'Санкт-Петербург, Приморский парк Победы',
    },
    create: {
      id: 'event_spb_3',
      title: 'Зимний забег',
      subtitle: 'Крестовский остров',
      shortDescription: 'Традиционный спортивный сбор всех отрядов города.',
      description:
        'Общий сбор на Крестовском. Дистанция 5 км для всех желающих.',
      date: new Date('2025-12-25T10:00:00'),
      dateLabel: '25 декабря, 10:00',
      location: 'Санкт-Петербург, Приморский парк Победы',
      latitude: 59.9723,
      longitude: 30.2494,
      imageUrl: 'https://placehold.co/800x600/475569/white?text=Winter+Run',
      pollQuestion: 'Готов пробежать 5 км?',
      status: EventStatus.APPROVED,
      coinsReward: 120,
      organizerId: demoCommissar.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_pending_1' },
    update: {
      latitude: 57.8136,
      longitude: 27.6118,
      status: EventStatus.PENDING,
      dateLabel: '10 февраля, 12:00',
      location: 'Печоры, Городская площадь',
    },
    create: {
      id: 'event_pending_1',
      title: 'Слет в Печорах',
      subtitle: 'Ожидает модерации',
      shortDescription: 'Планируемый сбор активов Псковской области.',
      description: 'Большое событие для местных отрядов.',
      date: new Date('2026-02-10T12:00:00'),
      dateLabel: '10 февраля, 12:00',
      location: 'Печоры, Городская площадь',
      latitude: 57.8136,
      longitude: 27.6118,
      imageUrl: 'https://placehold.co/800x600/94a3b8/white?text=Pechory+Meetup',
      pollQuestion: 'Будешь участвовать?',
      status: EventStatus.PENDING,
      coinsReward: 50,
      organizerId: demoCommissar.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_pending_2' },
    update: {
      latitude: 57.8194,
      longitude: 28.3317,
      status: EventStatus.NEEDS_REVISION,
      moderationComment: 'Уточните программу вечера и ожидаемое количество участников.',
      dateLabel: '15 февраля, 19:00',
      location: 'Псков, наб. реки Великой',
    },
    create: {
      id: 'event_pending_2',
      title: 'Творческий вечер',
      subtitle: 'Псков, Креативное пространство',
      shortDescription:
        'Конкурс талантов среди бойцов студенческих отрядов ПсковГУ.',
      description: 'Вечер песен, танцев и стихов.',
      date: new Date('2026-02-15T19:00:00'),
      dateLabel: '15 февраля, 19:00',
      location: 'Псков, наб. реки Великой',
      latitude: 57.8194,
      longitude: 28.3317,
      imageUrl:
        'https://placehold.co/800x600/cbd5e1/334155?text=Creative+Night',
      pollQuestion: 'Хочешь выступить?',
      status: EventStatus.NEEDS_REVISION,
      moderationComment: 'Уточните программу вечера и ожидаемое количество участников.',
      coinsReward: 40,
      organizerId: demoCommissar.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 'event_pending_3' },
    update: {
      latitude: 57.7101,
      longitude: 27.8601,
      status: EventStatus.PENDING,
      dateLabel: '22 февраля, 10:00',
      location: 'Изборск, Словянские ключи',
    },
    create: {
      id: 'event_pending_3',
      title: 'Эко-десант',
      subtitle: 'Изборск, Территория крепости',
      shortDescription: 'Волонтерская акция по уборке.',
      description: 'Помогаем восстанавливать историческое наследие.',
      date: new Date('2026-02-22T10:00:00'),
      dateLabel: '22 февраля, 10:00',
      location: 'Изборск, Словянские ключи',
      latitude: 57.7101,
      longitude: 27.8601,
      imageUrl: 'https://placehold.co/800x600/64748b/white?text=Eco+Action',
      pollQuestion: 'Готов помочь природе?',
      status: EventStatus.PENDING,
      coinsReward: 150,
      organizerId: demoCommissar.id,
    },
  });

  console.log(
    `Seed complete: ${formerLottieAsWear.length} premium wear (ex-Lottie), ${catItems.length} cat wear items.`,
  );
  console.log(
    'Подсказка: чтобы твой VK-аккаунт всегда был COMMANDER в проде, добавь в .env на сервере ADMIN_VK_IDS=<твой_vk_id> и перезапусти backend.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
