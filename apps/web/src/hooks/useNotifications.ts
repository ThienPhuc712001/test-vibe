import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: any;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PRODUCT_LIKED = 'PRODUCT_LIKED',
  PRODUCT_REVIEWED = 'PRODUCT_REVIEWED',
  SHOP_FOLLOWED = 'SHOP_FOLLOWED',
  LIVE_STREAM_STARTED = 'LIVE_STREAM_STARTED',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
}

interface UseNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export function useNotifications(params: UseNotificationsParams = {}) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', params],
    queryFn: () => apiClient.get('/notifications', { params }).then(res => res.data),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationIds: string[]) =>
      apiClient.patch('/notifications/read', { notificationIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = (notificationIds: string[]) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const unreadCount = data?.unreadCount || 0;

  return {
    notifications: data?.notifications || [],
    unreadCount,
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  };
}