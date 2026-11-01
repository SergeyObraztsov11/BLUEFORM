import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { requestHeaders } from '~/utils/apiError';

export type ShopNotification = {
  id: string;
  type: 'REGISTRATION_SUCCESS' | 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED';
  title: string;
  body: string;
  href: string | null;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<ShopNotification[]>([]);
  const unreadCount = ref(0);
  const loaded = ref(false);
  const error = ref<string | null>(null);

  const unreadItems = computed(() => items.value.filter((item) => !item.read));

  async function load() {
    error.value = null;
    try {
      const response = await $fetch<{ items: ShopNotification[]; unreadCount: number }>(
        '/api/notifications',
        { headers: requestHeaders() },
      );
      items.value = response.items;
      unreadCount.value = response.unreadCount;
      loaded.value = true;
    } catch (reason) {
      items.value = [];
      unreadCount.value = 0;
      loaded.value = true;
      error.value = reason instanceof Error ? reason.message : 'Не удалось загрузить уведомления.';
    }
  }

  function clear() {
    items.value = [];
    unreadCount.value = 0;
    loaded.value = false;
    error.value = null;
  }

  async function markRead(id: string) {
    const current = items.value.find((item) => item.id === id);
    if (!current || current.read) return;
    current.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
    try {
      await $fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: requestHeaders(),
      });
    } catch {
      current.read = false;
      unreadCount.value += 1;
    }
  }

  async function markAllRead() {
    const previous = items.value.map((item) => ({ ...item }));
    const previousUnread = unreadCount.value;
    items.value = items.value.map((item) => ({ ...item, read: true }));
    unreadCount.value = 0;
    try {
      await $fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: requestHeaders(),
      });
    } catch {
      items.value = previous;
      unreadCount.value = previousUnread;
    }
  }

  async function ensureWelcome() {
    try {
      const response = await $fetch<{ created: boolean }>('/api/notifications/welcome', {
        method: 'POST',
        headers: requestHeaders(),
      });
      if (response.created) await load();
    } catch {
      // Welcome notification is best-effort after registration.
    }
  }

  return {
    items,
    unreadCount,
    unreadItems,
    loaded,
    error,
    load,
    clear,
    markRead,
    markAllRead,
    ensureWelcome,
  };
});
