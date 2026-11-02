export type OrderListItem = {
  id: string;
  status: string;
  statusLabel: string;
  total: number;
  quantity: number;
  createdAt: string;
  lines: { productName: string; shade: string; size: string; quantity: number; price: number }[];
};
