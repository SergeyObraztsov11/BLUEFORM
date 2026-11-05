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

await request('/settings', {
  method: 'PATCH',
  token,
  body: { project_name: 'BLUEFORM', default_language: 'ru-RU' },
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
