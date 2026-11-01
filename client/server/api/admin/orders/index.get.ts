import { requireAdmin } from '../../../utils/admin';
import { listAdminOrders } from '../../../utils/adminOrders';

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const query = getQuery(event);
  const q = typeof query.q === 'string' ? query.q : undefined;
  return listAdminOrders(q);
});
