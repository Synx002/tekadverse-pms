import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import { useNotificationStore } from '../../store/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export const NotificationDropdown = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationsApi.getAll();
            if (res.success && res.data) {
                setNotifications(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Set up polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id);
            markAsRead(id);
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            markAllAsRead();
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await notificationsApi.delete(id);
            removeNotification(id);
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        setIsOpen(false);

        // Simple routing based on type
        if (notification.related_type === 'task') {
            navigate(`/tasks/${notification.related_id}`);
        } else if (notification.type === 'withdrawal_request') {
            navigate('/withdrawals');
        } else if (notification.type === 'withdrawal_update') {
            navigate('/earnings');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Check size={12} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-sm">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">No notifications yet</p>
                                <p className="text-xs mt-1">We'll notify you when something happens</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notification.is_read ? 'bg-blue-50/30' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-blue-600' : 'bg-transparent'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="text-xs font-bold text-gray-600 hover:text-gray-900"
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
