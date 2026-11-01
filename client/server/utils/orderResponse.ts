import {
  allowedOrderTransitions,
  orderPaymentStatusLabel,
  orderStatusLabel,
} from '../../../shared/order-status';
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
  paymentStatus?: string | null;
  adminComment?: string | null;
  trackingNumber?: string | null;
  email: string;
  firstName: string;
  phone: string;
  deliveryCity: string | null;
  deliveryAddress: string | null;
  deliveryPostalCode: string | null;
  deliveryComment: string | null;
  totalKopecks: number;
  createdAt: Date;
  updatedAt?: Date | null;
  items: OrderLine[];
};

export function toOrderResponse(order: OrderRecord) {
  const paymentStatus = order.paymentStatus ?? 'CONDITIONAL';
  return {
    id: order.id,
    status: order.status,
    statusLabel: orderStatusLabel(order.status),
    paymentStatus,
    paymentStatusLabel: orderPaymentStatusLabel(paymentStatus),
    adminComment: order.adminComment ?? null,
    trackingNumber: order.trackingNumber ?? null,
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
    updatedAt: order.updatedAt ? order.updatedAt.toISOString() : order.createdAt.toISOString(),
    allowedStatuses: allowedOrderTransitions(order.status),
    lines: order.items.map((item) => ({
      productName: item.productName,
      shade: item.shade,
      size: item.sizeCode,
      quantity: item.quantity,
      price: rubles(item.priceKopecks),
    })),
  };
}

export type OrderResponse = ReturnType<typeof toOrderResponse>;
