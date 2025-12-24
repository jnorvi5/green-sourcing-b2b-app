/**
 * Custom hook for supplier real-time notifications
 * Manages Supabase real-time subscriptions for RFQ updates
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'new_rfq' | 'quote_status' | 'urgent_deadline' | 'milestone';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface UseSupplierNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export function useSupplierNotifications(
  supplierId: string | null
): UseSupplierNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
  }, []);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!supplierId) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscriptions = async () => {
      // Subscribe to new RFQs
      channel = supabase
        .channel('supplier-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rfqs',
            filter: `supplier_id=eq.${supplierId}`,
          },
          (payload) => {
            const rfq = payload.new as { id: string; project_name: string };
            addNotification({
              type: 'new_rfq',
              title: 'New RFQ Match!',
              message: `New RFQ for "${rfq.project_name}"`,
              link: `/rfq/${rfq.id}`,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rfq_responses',
            filter: `supplier_id=eq.${supplierId}`,
          },
          (payload) => {
            const response = payload.new as {
              id: string;
              status: string;
              rfq_id: string;
            };
            
            // Only notify on status changes
            const oldResponse = payload.old as { status: string };
            if (response.status !== oldResponse.status) {
              let title = 'Quote Status Updated';
              let message = `Your quote status changed to ${response.status}`;

              if (response.status === 'accepted') {
                title = '🎉 Quote Accepted!';
                message = 'Congratulations! Your quote was accepted.';
              } else if (response.status === 'rejected') {
                title = 'Quote Not Selected';
                message = 'Your quote was not selected for this project.';
              }

              addNotification({
                type: 'quote_status',
                title,
                message,
                link: `/supplier/dashboard`,
              });
            }
          }
        )
        .subscribe();

      // Check for urgent deadlines (RFQs with deadline < 24 hours)
      const checkUrgentDeadlines = async () => {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: urgentRfqs } = await supabase
          .from('rfqs')
          .select('id, project_name, delivery_deadline')
          .eq('supplier_id', supplierId)
          .eq('status', 'pending')
          .gte('delivery_deadline', now.toISOString())
          .lte('delivery_deadline', tomorrow.toISOString());

        if (urgentRfqs && urgentRfqs.length > 0) {
          urgentRfqs.forEach((rfq) => {
            addNotification({
              type: 'urgent_deadline',
              title: '⏰ Urgent Deadline!',
              message: `RFQ "${rfq.project_name}" deadline is in less than 24 hours`,
              link: `/rfq/${rfq.id}`,
            });
          });
        }
      };

      // Check urgent deadlines on mount and every 30 minutes
      checkUrgentDeadlines();
      const urgentCheckInterval = setInterval(checkUrgentDeadlines, 30 * 60 * 1000);

      return () => {
        clearInterval(urgentCheckInterval);
      };
    };

    const cleanup = setupSubscriptions();

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });
      
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supplierId, supabase, addNotification]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
