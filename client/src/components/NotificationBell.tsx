import { Bell } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const { notifications, markNotificationAsRead, clearAllNotifications } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Filter notifications for current user
    const userNotifications = notifications.filter(n => n.userId === user?.id);
    const unreadCount = userNotifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: typeof notifications[0]) => {
        const notificationId = (notification as any)._id || notification.id;
        markNotificationAsRead(notificationId);
        navigate(`/bugs/${notification.bugId}`);
        setIsOpen(false);
    };

    const handleClearAll = () => {
        clearAllNotifications();
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Notification Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                {userNotifications.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto flex-1">
                                {userNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No notifications
                                    </div>
                                ) : (
                                    userNotifications.map((notification) => {
                                        const notificationId = (notification as any)._id || notification.id;
                                        return (
                                            <div
                                                key={notificationId}
                                                className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notification.read ? 'bg-primary/5' : ''
                                                    }`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {notification.bugTitle}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                            {new Date(notification.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markNotificationAsRead(notificationId);
                                                            }}
                                                            className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            Mark Read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
