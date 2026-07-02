'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getClientUser } from '@/src/lib/auth-client';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [togglingNotifications, setTogglingNotifications] = useState(false);

  // Check user and load notifications
  useEffect(() => {
    const checkUserAndLoad = async () => {
      const user = getClientUser();
      if (user) {
        setCurrentUser({ id: user.id });
        // Load user's notification preference
        try {
          const response = await fetch('/api/auth/user');
          if (response.ok) {
            const data = await response.json();
            setNotificationsEnabled(data.user?.notifications_enabled || false);
          }
        } catch (err) {
          console.error('Error checking notification preference:', err);
        }
      }
    };

    checkUserAndLoad();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const url = new URL('/api/notifications', window.location.origin);
        url.searchParams.set('page', '1');

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    // Reload every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleToggleNotifications = async () => {
    setTogglingNotifications(true);
    try {
      const response = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications_enabled: !notificationsEnabled }),
      });

      if (response.ok) {
        setNotificationsEnabled(!notificationsEnabled);
      }
    } catch (err) {
      console.error('Error toggling notifications:', err);
    } finally {
      setTogglingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'mark_read',
        }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleDelete = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds,
          action: 'delete',
        }),
      });

      if (response.ok) {
        setNotifications(
          notifications.filter((n) => !notificationIds.includes(n.id))
        );
      }
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  if (!currentUser) {
    return (
      <Link
        href="/auth"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-rbx-surface-2 text-rbx-muted transition hover:bg-rbx-surface-3 hover:text-white"
        title="Sign in to enable notifications"
      >
        🔔
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Toggle notifications menu"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-rbx-surface-2 text-rbx-muted transition hover:bg-rbx-surface-3 hover:text-white"
        title="Notifications"
      >
        {notificationsEnabled ? '🔔' : '🔇'}
        {unreadCount > 0 && notificationsEnabled && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rbx-orange text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-rbx-border bg-rbx-surface shadow-xl z-50">
          <div className="border-b border-rbx-border px-4 py-3 flex items-center justify-between">
            <h3 className="font-bold text-white">Notifications</h3>
            <button
              onClick={handleToggleNotifications}
              disabled={togglingNotifications}
              aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
              className={`text-lg transition ${notificationsEnabled ? 'text-rbx-orange hover:text-white' : 'text-rbx-muted hover:text-white'}`}
            >
              {notificationsEnabled ? '🔔' : '🔇'}
            </button>
          </div>

          {!notificationsEnabled && (
            <div className="border-b border-rbx-border/30 px-4 py-3 bg-rbx-surface-2">
              <p className="text-xs text-rbx-muted mb-2">Notifications are disabled</p>
              <button
                onClick={handleToggleNotifications}
                disabled={togglingNotifications}
                className="text-xs bg-rbx-orange text-white px-3 py-1 rounded transition hover:opacity-90 disabled:opacity-50"
              >
                Enable Notifications
              </button>
            </div>
          )}

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-rbx-muted">
              Loading…
            </div>
          ) : notifications.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border-b border-rbx-border/30 px-4 py-3 transition hover:bg-rbx-surface-2 ${
                    !notif.read ? 'bg-rbx-surface-2/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{notif.title}</p>
                      <p className="mt-1 text-xs text-rbx-muted line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="mt-2 text-xs text-rbx-muted">
                        {dateFormatter.format(new Date(notif.created_at))}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-1 h-2 w-2 rounded-full bg-rbx-orange flex-shrink-0" />
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead([notif.id])}
                        className="text-xs text-rbx-muted hover:text-white transition"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete([notif.id])}
                      className="text-xs text-rbx-muted hover:text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-rbx-muted">
              {notificationsEnabled ? 'No notifications yet' : 'Enable notifications to receive updates'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
