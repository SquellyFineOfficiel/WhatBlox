'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
  }, []);

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

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative rounded-lg p-2 text-rbx-muted transition hover:text-white hover:bg-rbx-surface-2"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 rounded-full bg-rbx-orange text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-rbx-border bg-rbx-surface shadow-xl z-50">
          <div className="border-b border-rbx-border px-4 py-3">
            <h3 className="font-bold text-white">Notifications</h3>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-rbx-muted">
              Loading...
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
                        {new Date(notif.created_at).toLocaleDateString()}
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
              No notifications yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
