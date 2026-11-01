import { rubles } from './catalog';

type OrderLine = {
  quantity: number;
  priceKopecks: number;
  productName: string;
  shade: string;
  sizeCode: string;
};

type OrderRecord = {
  id: string;
  status: string;
  email: string;
  firstName: string;
  phone: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryComment: string | null;
  totalKopecks: number;
  createdAt: Date;
  items: OrderLine[];
};

export function toOrderResponse(order: OrderRecord) {
  return {
    id: order.id,
    status: order.status,
    email: order.email,
    firstName: order.firstName,
    phone: order.phone,
    deliveryCity: order.deliveryCity,
    deliveryAddress: order.deliveryAddress,
    deliveryPostalCode: order.deliveryPostalCode,
    deliveryComment: order.deliveryComment,
    total: rubles(order.totalKopecks),
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    lines: order.items.map((item) => ({
      productName: item.productName,
      shade: item.shade,
      size: item.sizeCode,
      quantity: item.quantity,
      price: rubles(item.priceKopecks),
    })),
  };
}
