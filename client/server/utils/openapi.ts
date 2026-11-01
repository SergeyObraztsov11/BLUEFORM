const product = {
  id: 'bf-women-jeans-straight',
  name: 'Прямые джинсы для женщин',
  image: '/images/catalog/women/jeans/straight.jpg',
  imageKind: 'product',
  category: 'women',
  categorySlug: 'jeans',
  shade: 'Индиго',
  sizes: [
    { code: '42', stock: 4 },
    { code: '44', stock: 9 },
    { code: '46', stock: 6 },
    { code: '48', stock: 3 },
    { code: '50', stock: 2 },
    { code: '52', stock: 0 },
  ],
  fit: 'Прямой',
  price: 7890,
  description: 'Прямые джинсы из плотного денима.',
  model: { heightCm: 176, size: '44' },
}

const cart = {
  items: [
    {
      key: 'cmvkcartitem0001',
      product: { ...product, price: 7890 },
      size: '44',
      quantity: 1,
      removed: false,
      lineTotal: 7890,
    },
  ],
}

function shopError(status: number, code: string, message: string, summary: string) {
  return {
    summary,
    value: { error: true, code, statusCode: status, message },
  }
}

function authError(code: string, message: string, summary: string) {
  return { summary, value: { code, message } }
}

const json = (schema: object, example?: unknown) => ({
  description: 'Успех',
  content: {
    'application/json': {
      schema,
      ...(example === undefined ? {} : { example }),
    },
  },
})

export const openApi = {
  openapi: '3.0.3',
  info: {
    title: 'BLUEFORM API',
    version: '1.0.0',
    description: [
      'Магазин: каталог, корзина, избранное и заказ без оплаты. Цены в ответах — рубли.',
      'Гость получает httpOnly-куку `bf_guest` при первом добавлении в корзину или избранное. В базе хранится только хеш.',
      'При регистрации и входе гостевая корзина и избранное объединяются с аккаунтом (`POST /api/session/adopt`).',
      'Вход и регистрация — Better Auth на `/api/auth`. Здесь описаны только вызовы витрины. Сессия — httpOnly-кука. Запросы из Swagger на этом же адресе её отправляют.',
      'Ошибка магазина: `{ error, code, statusCode, message }`. `code` стабильный и пишется в лог, `message` — текст для человека. Коды лежат в `server/utils/errors.ts`. Ошибка Better Auth: `{ code, message }`.',
    ].join('\n\n'),
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Каталог', description: 'Список принимает поиск, фильтры, сортировку и номер страницы. Карточка отдаёт остаток по каждому размеру.' },
    { name: 'Аккаунт', description: 'Текущая сессия и профиль покупателя.' },
    { name: 'Корзина', description: 'Гость или вошедший пользователь. Чужие позиции недоступны.' },
    { name: 'Избранное', description: 'Список цветомоделей. У гостя и пользователя свои записи.' },
    { name: 'Заказ', description: 'Создание заказа из активных позиций корзины. Оплаты и доставки нет.' },
    { name: 'Сессия гостя', description: 'Перенос или сброс гостевой корзины после входа.' },
    { name: 'Авторизация', description: 'Better Auth. Почта подтверждается пятизначным кодом, код живёт 5 минут.' },
  ],
  paths: {
    '/api/catalog/products': {
      get: {
        tags: ['Каталог'],
        summary: 'Список товаров',
        description: 'Пустая выдача — `200` и `items: []`. `total` считает все подошедшие товары, не только текущую страницу. Номер больше последней страницы возвращает последнюю.',
        operationId: 'listProducts',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Слова из названия, оттенка и фасона.' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price-asc', 'price-desc'] }, description: 'Без параметра порядок каталога: категория, название, оттенок.' },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'С 1, по 8 товаров.' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Slug раздела или `all`.' },
          { name: 'shade', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'size', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
          { name: 'fit', in: 'query', schema: { type: 'string', enum: ['free'] }, description: 'Только свободная посадка.' },
          { name: 'sale', in: 'query', schema: { type: 'string', enum: ['1'] } },
          { name: 'stock', in: 'query', schema: { type: 'string', enum: ['1'] }, description: 'Только товары, у которых хотя бы один размер в наличии.' },
          { name: 'minPrice', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'maxPrice', in: 'query', schema: { type: 'integer', minimum: 0 } },
        ],
        responses: {
          '200': json({ $ref: '#/components/schemas/CatalogPage' }, { items: [product], total: 1, page: 1, pageSize: 8 }),
          '400': shopResponses(400, {
            sort: shopError(400, 'CATALOG_INVALID_SORT', 'Неизвестная сортировка.', 'Неизвестный sort'),
            page: shopError(400, 'CATALOG_INVALID_PAGE', 'Некорректный номер страницы.', 'page меньше 1'),
            price: shopError(400, 'CATALOG_INVALID_PRICE', 'Некорректная цена.', 'Цена не число или минимум больше максимума'),
          }),
        },
      },
    },
    '/api/catalog/products/{id}': {
      get: {
        tags: ['Каталог'],
        summary: 'Карточка товара',
        operationId: 'getProduct',
        parameters: [{ $ref: '#/components/parameters/productId' }],
        responses: {
          '200': json({ $ref: '#/components/schemas/Product' }, product),
          '404': {
            description: 'Нет опубликованной цветомодели с таким id.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopError' }, examples: { missing: shopError(404, 'PRODUCT_NOT_FOUND', 'Товар не найден.', 'Нет такого товара') } } },
          },
        },
      },
    },
    '/api/catalog/categories': {
      get: {
        tags: ['Каталог'],
        summary: 'Дерево разделов',
        description: 'Название и родитель берутся из базы. Фасон пока подставляется из справочника витрины.',
        operationId: 'listCategories',
        responses: {
          '200': json({
            type: 'object',
            required: ['items'],
            properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Category' } } },
          }, { items: [{ slug: 'women-jeans-straight', name: 'Прямые', parent: 'women-jeans', fit: 'Прямой' }] }),
        },
      },
    },
    '/api/account': {
      get: {
        tags: ['Аккаунт'],
        summary: 'Текущий пользователь',
        description: 'Без сессии возвращает `user: null`, это не ошибка. Имя, фамилия и телефон пустые, если профиль ещё не сохраняли.',
        operationId: 'getAccount',
        responses: {
          '200': {
            description: 'Сессия есть или её нет.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Account' },
                examples: {
                  guest: { summary: 'Гость', value: { user: null } },
                  user: { summary: 'Вошедший', value: { user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', firstName: 'Мария', lastName: '', phone: '+79991112233' } } },
                },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Аккаунт'],
        summary: 'Обновить профиль',
        description: 'Нужна сессия. Можно передать имя, фамилию и телефон. Пустая строка очищает поле.',
        operationId: 'updateAccount',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAccount' }, example: { firstName: 'Мария', lastName: 'Иванова', phone: '+79991112233' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/Account' }, { user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', firstName: 'Мария', lastName: 'Иванова', phone: '+79991112233' } }),
          '400': shopResponses(400, { empty: shopError(400, 'PROFILE_NOTHING_TO_UPDATE', 'Нечего обновлять.', 'Нет полей'), phone: shopError(400, 'PROFILE_PHONE_INVALID', 'Укажите телефон.', 'Телефон короче 5 символов') }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
        },
      },
    },
    '/api/cart': {
      get: {
        tags: ['Корзина'],
        summary: 'Корзина',
        description: 'Без куки гостя и без сессии возвращает пустой список и ничего не создаёт. Позиции с `removed: true` остаются в ответе.',
        operationId: 'getCart',
        responses: { '200': json({ $ref: '#/components/schemas/Cart' }, cart) },
      },
    },
    '/api/cart/items': {
      post: {
        tags: ['Корзина'],
        summary: 'Добавить размер',
        description: 'Если такая позиция уже есть и не снята, количество увеличивается на 1. Снятая позиция начинается заново с 1. Если остатка не хватает, ответ `409` с кодом `OUT_OF_STOCK`. Первая запись гостя ставит куку `bf_guest`.',
        operationId: 'addCartItem',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddCartItem' }, example: { colorwayId: 'bf-women-jeans-straight', size: '44' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/Cart' }, cart),
          '400': shopResponses(400, { invalidJson: shopError(400, 'VALIDATION_FAILED', 'Invalid JSON body', 'Тело не JSON'), emptyField: shopError(400, 'VALIDATION_FAILED', 'Too small: expected string to have >=1 characters', 'Пустой colorwayId или size') }),
          '404': shopResponses(404, { unavailable: shopError(404, 'CART_SKU_UNAVAILABLE', 'Этот товар или размер недоступен.', 'Нет активного размера') }),
          '409': shopResponses(409, { stock: shopError(409, 'OUT_OF_STOCK', 'Недостаточно товара этого размера. В наличии: 0 шт.', 'Размера не хватает') }),
        },
      },
    },
    '/api/cart/items/{id}': {
      patch: {
        tags: ['Корзина'],
        summary: 'Изменить позицию',
        description: 'Нужно передать хотя бы одно поле. Количество от 1 до 99. Смена размера сливает количество с уже существующей позицией этого размера и удаляет старую строку.',
        operationId: 'updateCartItem',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Поле `key` из корзины.' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCartItem' }, example: { quantity: 2 } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/Cart' }, cart),
          '400': shopResponses(400, { empty: shopError(400, 'CART_NOTHING_TO_UPDATE', 'Нечего обновлять.', 'Пустой объект'), range: shopError(400, 'VALIDATION_FAILED', 'Too small: expected number to be >=1', 'Количество меньше 1 или больше 99') }),
          '404': shopResponses(404, { missing: shopError(404, 'CART_ITEM_NOT_FOUND', 'Позиция корзины не найдена.', 'Чужая или удалённая строка'), size: shopError(404, 'CART_SIZE_UNAVAILABLE', 'Этот размер недоступен.', 'Размера нет у товара') }),
          '409': shopResponses(409, { stock: shopError(409, 'OUT_OF_STOCK', 'Недостаточно товара этого размера. В наличии: 1 шт.', 'Количество больше остатка') }),
        },
      },
    },
    '/api/favorites': {
      get: {
        tags: ['Избранное'],
        summary: 'Список избранного',
        description: 'Без владельца возвращает пустой список.',
        operationId: 'listFavorites',
        responses: { '200': json({ type: 'object', required: ['items'], properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } }, { items: [product] }) },
      },
    },
    '/api/favorites/{colorwayId}': {
      put: {
        tags: ['Избранное'],
        summary: 'Добавить в избранное',
        description: 'Повторный вызов не создаёт дубль. Первая запись гостя ставит куку `bf_guest`.',
        operationId: 'addFavorite',
        parameters: [{ $ref: '#/components/parameters/colorwayId' }],
        responses: {
          '200': json({ type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' } } }, { ok: true }),
          '404': shopResponses(404, { missing: shopError(404, 'FAVORITE_UNAVAILABLE', 'Этот товар недоступен.', 'Нет опубликованной цветомодели') }),
        },
      },
      delete: {
        tags: ['Избранное'],
        summary: 'Убрать из избранного',
        description: 'Если записи уже нет или владельца нет, ответ всё равно `{ ok: true }`.',
        operationId: 'removeFavorite',
        parameters: [{ $ref: '#/components/parameters/colorwayId' }],
        responses: { '200': json({ type: 'object', required: ['ok'], properties: { ok: { type: 'boolean' } } }, { ok: true }) },
      },
    },
    '/api/orders': {
      get: {
        tags: ['Заказ'],
        summary: 'Заказы текущего пользователя',
        description: 'Гостевые заказы сюда не попадают: у них нет аккаунта.',
        operationId: 'listOrders',
        responses: {
          '200': json({ type: 'object', required: ['items'], properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } }, { items: [{ id: 'cmvk08eoc00033flqc9izejxj', status: 'NEW', email: 'maria@example.ru', firstName: 'Мария', phone: '+79991112233', total: 7890, quantity: 1, createdAt: '2026-10-22T12:00:00.000Z', lines: [{ productName: 'Прямые джинсы для женщин', shade: 'Индиго', size: '44', quantity: 1, price: 7890 }] }] }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
        },
      },
      post: {
        tags: ['Заказ'],
        summary: 'Создать заказ',
        description: 'Требуется вход. Берёт неснятые позиции с количеством больше 0. Цену и состав считает сервер. Остаток списывается в той же транзакции; если размера не хватает, заказ не создаётся. Позиции корзины после успеха удаляются. Имя и телефон сохраняются в профиль.',
        operationId: 'createOrder',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrder' }, example: { firstName: 'Мария', phone: '+79991112233', email: 'maria@example.ru' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/CreatedOrder' }, { id: 'cmvk08eoc00033flqc9izejxj', total: 7890, quantity: 1 }),
          '400': shopResponses(400, {
            name: shopError(400, 'ORDER_NAME_REQUIRED', 'Укажите имя.', 'Пустое имя'),
            phone: shopError(400, 'ORDER_PHONE_REQUIRED', 'Укажите телефон.', 'Телефон короче 5 символов'),
            email: shopError(400, 'ORDER_EMAIL_INVALID', 'Укажите почту.', 'Почта не похожа на адрес'),
            empty: shopError(400, 'ORDER_CART_EMPTY', 'В корзине нет товаров для оформления.', 'Нечего оформлять'),
          }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
          '409': shopResponses(409, { stock: shopError(409, 'ORDER_INSUFFICIENT_STOCK', 'Недостаточно товара: Прямые джинсы для женщин, Индиго, размер 44.', 'Остатка не хватает') }),
        },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Заказ'],
        summary: 'Один заказ текущего пользователя',
        description: 'Чужой и гостевой заказ отвечают как ненайденный.',
        operationId: 'getOrder',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': json({ $ref: '#/components/schemas/Order' }, { id: 'cmvk08eoc00033flqc9izejxj', status: 'NEW', email: 'maria@example.ru', firstName: 'Мария', phone: '+79991112233', total: 7890, quantity: 1, createdAt: '2026-10-22T12:00:00.000Z', lines: [{ productName: 'Прямые джинсы для женщин', shade: 'Индиго', size: '44', quantity: 1, price: 7890 }] }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
          '404': shopResponses(404, { missing: shopError(404, 'ORDER_NOT_FOUND', 'Заказ не найден.', 'Нет такого заказа у пользователя') }),
        },
      },
    },
    '/api/session/adopt': {
      post: {
        tags: ['Сессия гостя'],
        summary: 'Перенести корзину гостя на аккаунт',
        description: 'Нужна сессия. Количества одного размера складываются, избранное переносится без дублей, гостевая запись и кука удаляются. Витрина вызывает это после входа и регистрации. Без куки гостя `merged` равен `false`.',
        operationId: 'adoptGuest',
        responses: {
          '200': json({ type: 'object', required: ['merged'], properties: { merged: { type: 'boolean' } } }, { merged: true }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
        },
      },
    },
    '/api/session/discard': {
      post: {
        tags: ['Сессия гостя'],
        summary: 'Удалить корзину гостя',
        description: 'Нужна сессия. Гостевая корзина и избранное удаляются вместе с кукой и не попадают в аккаунт. Без куки гостя `discarded` равен `false`.',
        operationId: 'discardGuest',
        responses: {
          '200': json({ type: 'object', required: ['discarded'], properties: { discarded: { type: 'boolean' } } }, { discarded: true }),
          '401': shopResponses(401, { anonymous: shopError(401, 'SESSION_REQUIRED', 'Нужно войти в аккаунт.', 'Нет сессии') }),
        },
      },
    },
    '/api/auth/sign-up/email': {
      post: {
        tags: ['Авторизация'],
        summary: 'Регистрация',
        description: 'Создаёт пользователя с неподтверждённой почтой и отправляет пятизначный код. Сессию не открывает: `token` равен `null`. Пароль не короче 8 символов. `name` витрина заполняет почтой.',
        operationId: 'signUp',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignUp' }, example: { name: 'maria@example.ru', email: 'maria@example.ru', password: 'at-least-8' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/AuthResult' }, { token: null, user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', emailVerified: false } }),
          '400': authResponses({ short: authError('PASSWORD_TOO_SHORT', 'Password too short', 'Пароль короче 8 символов'), long: authError('PASSWORD_TOO_LONG', 'Password too long', 'Пароль слишком длинный'), invalid: authError('INVALID_EMAIL', 'Invalid email', 'Почта не похожа на адрес') }),
          '422': authResponses({ exists: authError('USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'User already exists. Use another email.', 'Такая почта уже есть') }),
        },
      },
    },
    '/api/auth/sign-in/email': {
      post: {
        tags: ['Авторизация'],
        summary: 'Вход по паролю',
        description: 'При успехе ставит куку сессии. Запрос с чужого origin, которого нет в доверенных (`localhost` и `127.0.0.1`), отклоняется.',
        operationId: 'signIn',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignIn' }, example: { email: 'maria@example.ru', password: 'at-least-8' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/AuthResult' }, { token: 'session-token', user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', emailVerified: true } }),
          '401': authResponses({ credentials: authError('INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password', 'Неверная почта или пароль') }),
          '403': authResponses({ unverified: authError('EMAIL_NOT_VERIFIED', 'Email not verified', 'Почта ещё не подтверждена'), origin: authError('INVALID_ORIGIN', 'Invalid origin', 'Адрес страницы не доверенный') }),
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['Авторизация'],
        summary: 'Выход',
        description: 'Снимает куку сессии. Тело можно не передавать. Корзину аккаунта в гостевую не копирует.',
        operationId: 'signOut',
        responses: { '200': json({ type: 'object', required: ['success'], properties: { success: { type: 'boolean' } } }, { success: true }) },
      },
    },
    '/api/auth/get-session': {
      get: {
        tags: ['Авторизация'],
        summary: 'Текущая сессия Better Auth',
        description: 'Без куки отвечает `null`, это не ошибка. Витрина для шапки использует `GET /api/account`.',
        operationId: 'getSession',
        responses: {
          '200': {
            description: 'Сессия или null.',
            content: {
              'application/json': {
                schema: { nullable: true, allOf: [{ $ref: '#/components/schemas/AuthSession' }] },
                examples: {
                  none: { summary: 'Нет куки', value: null },
                  active: { summary: 'Есть сессия', value: { session: { id: 'session_1', userId: 'user_1', expiresAt: '2026-11-21T00:00:00.000Z' }, user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', emailVerified: true } } },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/email-otp/send-verification-otp': {
      post: {
        tags: ['Авторизация'],
        summary: 'Отправить код',
        description: 'Всегда отвечает `{ success: true }`. Если пользователя нет, письмо не отправляется.',
        operationId: 'sendVerificationOtp',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SendOtp' }, example: { email: 'maria@example.ru', type: 'email-verification' } } },
        },
        responses: { '200': json({ type: 'object', required: ['success'], properties: { success: { type: 'boolean' } } }, { success: true }) },
      },
    },
    '/api/auth/email-otp/verify-email': {
      post: {
        tags: ['Авторизация'],
        summary: 'Подтвердить почту кодом',
        description: 'Верный код подтверждает почту и открывает сессию: в ответе есть `token`, ставится кука.',
        operationId: 'verifyEmail',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyEmail' }, example: { email: 'maria@example.ru', otp: '12345' } } },
        },
        responses: {
          '200': json({ $ref: '#/components/schemas/AuthResult' }, { token: 'session-token', user: { id: 'user_1', email: 'maria@example.ru', name: 'maria@example.ru', emailVerified: true } }),
          '400': authResponses({ invalid: authError('INVALID_OTP', 'Invalid OTP', 'Код неверный'), expired: authError('OTP_EXPIRED', 'OTP expired', 'Код старше 5 минут') }),
          '403': authResponses({ attempts: authError('TOO_MANY_ATTEMPTS', 'Too many attempts', 'Слишком много попыток') }),
        },
      },
    },
  },
  components: {
    parameters: {
      productId: { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Id цветомодели, например `bf-women-jeans-straight`.', example: 'bf-women-jeans-straight' },
      colorwayId: { name: 'colorwayId', in: 'path', required: true, schema: { type: 'string' }, example: 'bf-women-jeans-straight' },
    },
    schemas: {
      Product: {
        type: 'object',
        required: ['id', 'name', 'category', 'categorySlug', 'shade', 'sizes', 'fit', 'price'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          image: { type: 'string', description: 'Путь к статическому файлу. Нет картинки — поля нет.' },
          imageKind: { type: 'string', enum: ['product', 'fabric'] },
          category: { type: 'string', enum: ['women', 'men'] },
          categorySlug: { type: 'string' },
          shade: { type: 'string' },
          sizes: { type: 'array', items: { type: 'object', required: ['code', 'stock'], properties: { code: { type: 'string' }, stock: { type: 'integer' } } } },
          fit: { type: 'string' },
          price: { type: 'number', description: 'Рубли. В каталоге — минимальная цена активного размера. В корзине — цена выбранного размера.' },
          oldPrice: { type: 'number' },
          description: { type: 'string' },
          model: { type: 'object', properties: { heightCm: { type: 'integer' }, size: { type: 'string' }, weightKg: { type: 'integer' } } },
        },
      },
      Cart: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['key', 'product', 'size', 'quantity', 'removed', 'lineTotal'],
              properties: {
                key: { type: 'string' },
                product: { $ref: '#/components/schemas/Product' },
                size: { type: 'string' },
                quantity: { type: 'integer' },
                removed: { type: 'boolean' },
                lineTotal: { type: 'number', description: 'Цена размера умноженная на количество, в рублях. Ноль, если позиция убрана из заказа или размера нет в наличии.' },
              },
            },
          },
        },
      },
      AddCartItem: { type: 'object', required: ['colorwayId', 'size'], properties: { colorwayId: { type: 'string' }, size: { type: 'string' } } },
      UpdateCartItem: { type: 'object', properties: { quantity: { type: 'integer', minimum: 1, maximum: 99 }, removed: { type: 'boolean' }, size: { type: 'string', minLength: 1 } } },
      CreateOrder: { type: 'object', required: ['firstName', 'phone', 'email'], properties: { firstName: { type: 'string', minLength: 1 }, phone: { type: 'string', minLength: 1 }, email: { type: 'string', format: 'email' } } },
      CreatedOrder: { type: 'object', required: ['id', 'total', 'quantity'], properties: { id: { type: 'string' }, total: { type: 'number', description: 'Сумма в рублях.' }, quantity: { type: 'integer', description: 'Суммарное количество вещей.' } } },
      Account: { type: 'object', required: ['user'], properties: { user: { nullable: true, allOf: [{ $ref: '#/components/schemas/AccountUser' }] } } },
      CatalogPage: { type: 'object', required: ['items', 'total', 'page', 'pageSize'], properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Product' } }, total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' } } },
      Category: { type: 'object', required: ['slug', 'name', 'parent', 'fit'], properties: { slug: { type: 'string' }, name: { type: 'string' }, parent: { type: 'string', nullable: true }, fit: { type: 'string', nullable: true } } },
      UpdateAccount: { type: 'object', properties: { firstName: { type: 'string', maxLength: 80 }, lastName: { type: 'string', maxLength: 80 }, phone: { type: 'string', maxLength: 32 } } },
      Order: { type: 'object', required: ['id', 'status', 'email', 'firstName', 'phone', 'total', 'quantity', 'createdAt', 'lines'], properties: { id: { type: 'string' }, status: { type: 'string' }, email: { type: 'string' }, firstName: { type: 'string' }, phone: { type: 'string' }, total: { type: 'number' }, quantity: { type: 'integer' }, createdAt: { type: 'string', format: 'date-time' }, lines: { type: 'array', items: { type: 'object', properties: { productName: { type: 'string' }, shade: { type: 'string' }, size: { type: 'string' }, quantity: { type: 'integer' }, price: { type: 'number' } } } } } },
      AccountUser: { type: 'object', required: ['id', 'email', 'name', 'firstName', 'lastName', 'phone'], properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      SignUp: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } },
      SignIn: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } },
      SendOtp: { type: 'object', required: ['email', 'type'], properties: { email: { type: 'string', format: 'email' }, type: { type: 'string', enum: ['email-verification'] } } },
      VerifyEmail: { type: 'object', required: ['email', 'otp'], properties: { email: { type: 'string', format: 'email' }, otp: { type: 'string', minLength: 5, maxLength: 5 } } },
      AuthUser: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, emailVerified: { type: 'boolean' } } },
      AuthResult: { type: 'object', properties: { token: { type: 'string', nullable: true }, user: { $ref: '#/components/schemas/AuthUser' } } },
      AuthSession: { type: 'object', properties: { session: { type: 'object' }, user: { $ref: '#/components/schemas/AuthUser' } } },
      ShopError: { type: 'object', required: ['error', 'code', 'statusCode', 'message'], properties: { error: { type: 'boolean' }, code: { type: 'string', description: 'Стабильный код из server/utils/errors.ts.' }, statusCode: { type: 'integer' }, message: { type: 'string' } } },
      AuthError: { type: 'object', required: ['code', 'message'], properties: { code: { type: 'string' }, message: { type: 'string', description: 'Текст Better Auth на английском. Витрина показывает русский перевод.' } } },
    },
  },
}

function shopResponses(status: number, examples: Record<string, ReturnType<typeof shopError>>) {
  return {
    description: Object.values(examples).map((item) => item.summary).join('. ') + '.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ShopError' }, examples } },
  }
}

function authResponses(examples: Record<string, ReturnType<typeof authError>>) {
  return {
    description: Object.values(examples).map((item) => `${item.summary}: ${item.value.code}`).join('. ') + '.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthError' }, examples } },
  }
}
