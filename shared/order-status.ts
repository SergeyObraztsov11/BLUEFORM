export const ORDER_STATUSES = ['NEW', 'PROCESSING', 'SHIPPED', 'CANCELLED'] as const;

export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

const labels: Record<OrderStatusCode, string> = {
  NEW: 'Принят',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  CANCELLED: 'Отменён',
};

export function orderStatusLabel(status: string): string {
  return labels[status as OrderStatusCode] ?? status;
}
