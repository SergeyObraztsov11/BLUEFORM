import { requireAdmin } from '../../../utils/admin';
import { updateAdminOrder } from '../../../utils/adminOrders';
import { apiError } from '../../../utils/http';
import { adminOrderPatch, parseBody } from '../../../utils/validation';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, 'id');
  if (!id) apiError('ORDER_NOT_FOUND');
  const body = parseBody(adminOrderPatch, await readBody(event));
  return updateAdminOrder(id, body);
});
