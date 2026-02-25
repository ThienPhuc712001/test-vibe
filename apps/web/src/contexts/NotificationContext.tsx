'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  pagination: any;
  isLoading: boolean;
  error: any;
  markAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  isMarkingAsRead: boolean;
  isMarkingAllAsRead: boolean;
  isDeleting: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationData = useNotifications();

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}