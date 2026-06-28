import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface Notification {
  _id: string;
  type: 'DOUBT_POSTED' | 'DOUBT_REPLIED' | 'REMINDER_CREATED' | 'REMINDER_UPDATED';
  message: string;
  subjectId?: {
    _id: string;
    // other fields if needed
  };
  reminderId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const newSocket = io(API_BASE_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        newSocket.emit('join', user._id);
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        toast(notification.message, {
          icon: '🔔',
          duration: 4000,
          position: 'top-right',
        });
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      setNotifications([]);
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
