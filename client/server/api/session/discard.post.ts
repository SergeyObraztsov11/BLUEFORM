import { currentUserId, discardGuest } from '../../utils/guest';
import { apiError } from '../../utils/http';

export default defineEventHandler(async (event) => {
  const userId = await currentUserId(event);
  if (!userId) apiError('SESSION_REQUIRED');
  const discarded = await discardGuest(event);
  return { discarded };
});
