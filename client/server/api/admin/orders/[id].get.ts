import { requireAdmin } from '../../../utils/admin';
import { getAdminOrder } from '../../../utils/adminOrders';
import { apiError } from '../../../utils/http';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) apiError('ORDER_NOT_FOUND');
  return getAdminOrder(id);
});
