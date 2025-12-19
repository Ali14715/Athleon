import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  target_role: string;
  user_id?: number | null;
  pesanan_id?: number | null;
  pembayaran_id?: number | null;
  data?: Record<string, unknown> | null;
  sent_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefreshNotificationsOptions {
  silent?: boolean;
  limit?: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  initialized: boolean;
  refresh: (options?: RefreshNotificationsOptions) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const clear = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const fetchNotifications = useCallback(
    async (options: RefreshNotificationsOptions = {}) => {
      if (typeof window === "undefined") {
        return;
      }

      const token = getToken();
      if (!token) {
        clear();
        setInitialized(true);
        return;
      }

      // Check if user is admin - admin users don't need notifications
      try {
        const userResponse = await api.get("/api/auth/user");
        // Handle new API format: { status_code, message, data }
        const userData = userResponse.data?.data || userResponse.data;
        if (userData?.role === "admin") {
          clear();
          setInitialized(true);
          return;
        }
      } catch (error) {
        // If can't get user, skip notification fetch
        clear();
        setInitialized(true);
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
      }

      try {
        const response = await api.get("/api/customer/notifications", {
          params: {
            per_page: options.limit ?? 20,
          },
        });

        // Handle new API format: { status_code, message, data: { notifications: [], pagination: {}, meta: {} } }
        const responseData = response.data?.data || response.data;
        
        // API returns data.notifications array, not data.data
        let items: NotificationItem[] = [];
        if (Array.isArray(responseData?.notifications)) {
          items = responseData.notifications;
        } else if (Array.isArray(responseData?.data)) {
          items = responseData.data;
        } else if (Array.isArray(responseData)) {
          items = responseData;
        }
        setNotifications(items);

        const meta = responseData?.meta || response.data?.meta;
        const unreadFromApi = typeof meta?.unread_count === "number" ? meta.unread_count : null;
        setUnreadCount(unreadFromApi ?? items.filter((item) => !item.read_at).length);
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          clear();
        }
        console.error("Gagal memuat notifikasi:", error);
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
        setInitialized(true);
      }
    },
    [clear]
  );

  const markAsRead = useCallback(
    async (notificationId: number) => {
      let wasUnread = false;
      const readAt = new Date().toISOString();

      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.id === notificationId && !notification.read_at) {
            wasUnread = true;
            return { ...notification, read_at: readAt };
          }
          return notification;
        })
      );

      if (wasUnread) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      try {
        await api.post(`/api/customer/notifications/${notificationId}/read`);
      } catch (error) {
        console.error("Gagal menandai notifikasi:", error);
        fetchNotifications({ silent: true });
      }
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    setNotifications((prev) => prev.map((notification) => (notification.read_at ? notification : { ...notification, read_at: readAt })));
    setUnreadCount(0);

    try {
      await api.post("/api/customer/notifications/read-all");
    } catch (error) {
      console.error("Gagal menandai semua notifikasi:", error);
      fetchNotifications({ silent: true });
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications({ silent: true });

    const interval = setInterval(() => fetchNotifications({ silent: true }), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loginListener: EventListener = () => {
      fetchNotifications({ silent: true });
    };

    const logoutListener: EventListener = () => {
      clear();
    };

    const tokenExpiredListener: EventListener = () => {
      clear();
    };

    const storageListener = (event: StorageEvent) => {
      if (event.key === "token") {
        if (event.newValue) {
          fetchNotifications({ silent: true });
        } else {
          clear();
        }
      }
    };

    const notificationUpdateListener: EventListener = () => {
      // Refresh immediately when notification update event is triggered
      fetchNotifications({ silent: true });
    };

    window.addEventListener("auth:login", loginListener);
    window.addEventListener("auth:logout", logoutListener);
    window.addEventListener("auth:tokenExpired", tokenExpiredListener);
    window.addEventListener("storage", storageListener);
    window.addEventListener("notificationUpdate", notificationUpdateListener);

    return () => {
      window.removeEventListener("auth:login", loginListener);
      window.removeEventListener("auth:logout", logoutListener);
      window.removeEventListener("auth:tokenExpired", tokenExpiredListener);
      window.removeEventListener("storage", storageListener);
      window.removeEventListener("notificationUpdate", notificationUpdateListener);
    };
  }, [clear, fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      initialized,
      refresh: fetchNotifications,
      markAsRead,
      markAllAsRead,
      clear,
    }),
    [notifications, unreadCount, isLoading, initialized, fetchNotifications, markAsRead, markAllAsRead, clear]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }

  return context;
};
