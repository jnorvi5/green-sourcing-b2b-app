'use client';

import { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Notification } from '@/hooks/useSupplierNotifications';
import Link from 'next/link';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_rfq':
        return '📋';
      case 'quote_status':
        return '📊';
      case 'urgent_deadline':
        return '⏰';
      case 'milestone':
        return '🎉';
      default:
        return '🔔';
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative gap-2"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <FiBell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className="hidden sm:inline">Notifications</span>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] max-h-[600px] overflow-hidden shadow-xl border-2 z-50">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="text-xs"
                        aria-label="Mark all as read"
                      >
                        <FiCheck className="w-3 h-3 mr-1" />
                        Read all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClear}
                      className="text-xs text-red-500 hover:text-red-600"
                      aria-label="Clear all notifications"
                    >
                      <FiX className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FiBell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium mb-1">No notifications</p>
                  <p className="text-xs text-muted-foreground">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-teal-500/5 border-l-4 border-l-teal-500' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead(notification.id);
                        }
                        if (notification.link) {
                          setIsOpen(false);
                        }
                      }}
                      role="article"
                      aria-label={notification.title}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-foreground truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                            {notification.link && (
                              <Link href={notification.link}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                  }}
                                >
                                  View →
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
