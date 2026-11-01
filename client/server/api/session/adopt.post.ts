import { adoptGuest, currentUserId } from '../../utils/guest';
import { apiError } from '../../utils/http';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const merged = await adoptGuest(event, userId);
  return { merged };
});
