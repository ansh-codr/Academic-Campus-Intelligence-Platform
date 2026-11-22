import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CampusService } from '@/services/campusService';
import { CampusNotification } from '@solvesphere/shared';
import { Badge } from '@/components/ui/Badge';
import { Bell, CheckCheck, Clock, Ticket } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<CampusNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = CampusService.subscribeNotifications(user.id, (items) => {
      setNotifications(items);
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await CampusService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await CampusService.markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'RESOLVED':
        return 'green';
      case 'REOPENED':
        return 'rose';
      case 'ASSIGNED':
        return 'cyan';
      case 'STATUS_CHANGED':
        return 'blue';
      default:
        return 'amber';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="View notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white dark:bg-brand-surfaceDark border border-slate-200 dark:border-slate-800 shadow-xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-blue/10 dark:bg-brand-cyan/20 text-brand-blue dark:text-brand-cyan font-bold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-brand-blue dark:text-brand-cyan hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No notifications yet. You will be notified when your tickets are reviewed or updated.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => !notif.read && handleMarkAsRead(notif.id, e)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500'
                      : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={getBadgeVariant(notif.type)} size="sm">
                      {notif.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="font-semibold text-xs mt-1.5">{notif.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  {!notif.read && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="text-[10px] text-brand-blue dark:text-brand-cyan font-bold hover:underline"
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
