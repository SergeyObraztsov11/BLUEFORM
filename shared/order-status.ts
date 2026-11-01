export const ORDER_STATUSES = ['NEW', 'PROCESSING', 'SHIPPED', 'CANCELLED'] as const;

export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = ['CONDITIONAL'] as const;

export type OrderPaymentStatusCode = (typeof ORDER_PAYMENT_STATUSES)[number];

const labels: Record<OrderStatusCode, string> = {
  NEW: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  CANCELLED: 'Отменён',
};

const paymentLabels: Record<OrderPaymentStatusCode, string> = {
  CONDITIONAL: 'Условная (без списания)',
};

export function orderStatusLabel(status: string): string {
  return labels[status as OrderStatusCode] ?? status;
}

export function orderPaymentStatusLabel(status: string): string {
  return paymentLabels[status as OrderPaymentStatusCode] ?? status;
}

export function allowedOrderTransitions(status: string): OrderStatusCode[] {
  switch (status as OrderStatusCode) {
    case 'NEW':
      return ['PROCESSING', 'CANCELLED'];
    case 'PROCESSING':
      return ['SHIPPED', 'CANCELLED'];
    case 'SHIPPED':
    case 'CANCELLED':
      return [];
    default:
      return [];
  }
}

export function isOrderStatus(value: string): value is OrderStatusCode {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
