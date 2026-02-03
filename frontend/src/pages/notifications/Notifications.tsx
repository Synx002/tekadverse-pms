import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, Loader2 } from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import { useNotificationStore } from '../../store/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export const Notifications = () => {
    const [loading, setLoading] = useState(false);
    const { notifications, setNotifications, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationsApi.getAll();
            if (res.success && res.data) {
                setNotifications(res.data);
            }
        } catch (error) {
            toast.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
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

    const handleDelete = async (id: number) => {
        try {
            await notificationsApi.delete(id);
            removeNotification(id);
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">Stay updated with your latest activities</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Check size={16} />
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading && notifications.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Loading your notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-16 text-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">No notifications yet</p>
                        <p className="mt-1">We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-6 flex gap-4 transition-colors group relative ${!notification.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                            >
                                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className={`text-base ${!notification.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title || notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </p>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <Calendar size={12} />
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </div>
                                            <div className="flex gap-2">
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
