const baseUrl = process.env.DIRECTUS_URL || 'http://directus-shop:8055';
const email = process.env.DIRECTUS_ADMIN_EMAIL;
const password = process.env.DIRECTUS_ADMIN_PASSWORD;
if (!email || !password) throw new Error('DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD are required');

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}`);
  return response.json();
}

let token;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    token = (await request('/auth/login', { method: 'POST', body: { email, password } })).data.access_token;
    break;
  } catch (error) {
    if (attempt === 59) throw error;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

const settings = (await request('/settings?fields=module_bar', { token })).data;
const moduleBar =
  settings.module_bar ??
  ['content', 'users', 'files', 'insights', 'docs', 'settings'].map((id) => ({
    type: 'module',
    id,
    enabled: true,
  }));
if (!moduleBar.some((item) => item.type === 'module' && item.id === 'blueform-catalog')) {
  moduleBar.unshift({ type: 'module', id: 'blueform-catalog', enabled: true });
}
await request('/settings', {
  method: 'PATCH',
  token,
  body: { project_name: 'BLUEFORM', default_language: 'ru-RU', module_bar: moduleBar },
});

const collections = [
  {
    name: 'orders',
    label: 'Заказы',
    icon: 'shopping_bag',
    note: 'Просмотр заказов. Для изменения статуса, трек-номера и комментария откройте админ-панель магазина: http://localhost:3000/admin/orders',
    hidden: false,
    fields: {
      id: 'Номер заказа',
      email: 'Почта',
      firstName: 'Имя',
      phone: 'Телефон',
      status: 'Статус',
      paymentStatus: 'Оплата',
      totalKopecks: 'Сумма, коп.',
      deliveryCity: 'Город',
      deliveryAddress: 'Адрес доставки',
      deliveryPostalCode: 'Индекс',
      deliveryComment: 'Комментарий к доставке',
      adminComment: 'Комментарий менеджера',
      trackingNumber: 'Трек-номер',
      createdAt: 'Создан',
      updatedAt: 'Обновлён',
    },
    hiddenFields: ['userId', 'idempotencyKey'],
  },
  {
    name: 'order_items',
    label: 'Состав заказов',
    icon: 'inventory_2',
    note: 'Строки заказов доступны только для просмотра.',
    hidden: false,
    fields: {
      id: 'Номер строки',
      orderId: 'Заказ',
      productName: 'Товар',
      shade: 'Цвет',
      sizeCode: 'Размер',
      quantity: 'Количество',
      priceKopecks: 'Цена, коп.',
    },
    hiddenFields: ['skuId'],
  },
];

for (const collection of collections) {
  await request(`/collections/${collection.name}`, {
    method: 'PATCH',
    token,
    body: {
      meta: {
        icon: collection.icon,
        note: collection.note,
        hidden: collection.hidden,
        translations: [{ language: 'ru-RU', translation: collection.label }],
      },
    },
  });
  const fields = (await request(`/fields/${collection.name}`, { token })).data;
  for (const field of fields) {
    const name = field.field;
    await request(`/fields/${collection.name}/${name}`, {
      method: 'PATCH',
      token,
      body: {
        meta: {
          readonly: true,
          hidden: collection.hiddenFields.includes(name),
          ...(collection.fields[name]
            ? { translations: [{ language: 'ru-RU', translation: collection.fields[name] }] }
            : {}),
        },
      },
    });
  }
}
console.log('Directus shop order collections configured for read-only use.');

const productStatusChoices = [
  { text: 'Черновик', value: 'DRAFT' },
  { text: 'Опубликован', value: 'PUBLISHED' },
  { text: 'Архив', value: 'ARCHIVED' },
];
const catalogCollections = [
  {
    name: 'products',
    hidden: true,
    label: 'Товары',
    icon: 'checkroom',
    template: '{{name}}',
    note: 'Сначала создайте товар, затем добавьте его цвет и размеры. Для появления в каталоге опубликуйте товар и цвет.',
    fields: {
      name: { label: 'Название' },
      description: { label: 'Описание', interface: 'input-multiline' },
      categoryId: { label: 'Категория', relation: true },
      sizeSystemId: { label: 'Размерная сетка', relation: true },
      status: { label: 'Публикация', choices: productStatusChoices },
    },
  },
  {
    name: 'product_colorways',
    hidden: true,
    label: 'Цвета товаров',
    icon: 'palette',
    template: '{{productId.name}} — {{fabricId.colorName}}',
    note: 'Для каждого цвета создайте размеры в разделе «Размеры и цены». Цвет должен быть опубликован вместе с товаром.',
    fields: {
      productId: { label: 'Товар', relation: true },
      fabricId: { label: 'Цвет', relation: true },
      status: { label: 'Публикация', choices: productStatusChoices },
      modelHeightCm: { label: 'Рост модели, см' },
      modelWeightKg: { label: 'Вес модели, кг' },
      modelWornSizeCode: { label: 'Размер на модели' },
    },
  },
  {
    name: 'skus',
    hidden: true,
    label: 'Размеры и цены',
    icon: 'straighten',
    template: '{{colorwayId.productId.name}} — {{colorwayId.fabricId.colorName}} — {{sizeId.code}}',
    note: 'Цены пока вводятся в копейках: например, 7 890 ₽ = 789000 коп. Укажите остаток отдельно для каждого размера.',
    fields: {
      colorwayId: { label: 'Товар и цвет', relation: true },
      sizeId: { label: 'Размер', relation: true },
      priceKopecks: { label: 'Цена, коп.', note: 'Например, 789000 = 7 890 ₽.' },
      oldPriceKopecks: {
        label: 'Цена до скидки, коп.',
        note: 'Необязательно; должна быть больше текущей цены.',
      },
      stockQuantity: { label: 'Остаток, шт.' },
      isActive: { label: 'Размер доступен' },
    },
  },
  {
    name: 'categories',
    label: 'Категории',
    hidden: true,
    template: '{{name}} ({{slug}})',
    fields: { name: { label: 'Категория' }, slug: { label: 'Код категории' } },
  },
  {
    name: 'fabrics',
    label: 'Цвета',
    hidden: true,
    template: '{{colorName}}',
    fields: { colorName: { label: 'Цвет' } },
  },
  {
    name: 'sizes',
    label: 'Размеры',
    hidden: true,
    template: '{{code}}',
    fields: { code: { label: 'Размер' } },
  },
  {
    name: 'size_systems',
    label: 'Размерные сетки',
    hidden: true,
    template: '{{name}}',
    fields: { name: { label: 'Размерная сетка' } },
  },
];

for (const collection of catalogCollections) {
  await request(`/collections/${collection.name}`, {
    method: 'PATCH',
    token,
    body: {
      meta: {
        icon: collection.icon || 'folder',
        note: collection.note || null,
        hidden: collection.hidden || false,
        display_template: collection.template,
        translations: [{ language: 'ru-RU', translation: collection.label }],
      },
    },
  });
  const fields = (await request(`/fields/${collection.name}`, { token })).data;
  for (const field of fields) {
    const config = collection.fields[field.field];
    const meta = {
      hidden: !config,
      readonly: Boolean(collection.hidden || !config),
      ...(config?.label ? { translations: [{ language: 'ru-RU', translation: config.label }] } : {}),
      ...(config?.note ? { note: config.note } : {}),
      ...(config?.relation
        ? { interface: 'select-dropdown-m2o', special: ['m2o'], options: { enableCreate: false } }
        : {}),
      ...(config?.interface ? { interface: config.interface } : {}),
      ...(config?.choices ? { interface: 'select-dropdown', options: { choices: config.choices } } : {}),
    };
    await request(`/fields/${collection.name}/${field.field}`, { method: 'PATCH', token, body: { meta } });
  }
}
console.log('Directus catalog collections configured.');
