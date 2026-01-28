import api from '@/lib/api';

export interface Activity {
    id: string;
    type: 'price' | 'post' | 'forecast';
    title: string;
    timestamp: string;
    detail?: string;
}

export interface NotificationResponse {
    id: string;
    user_id: string;
    title?: string;
    message: string;
    notification_type?: string;
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

export const notificationsService = {
    async getNotifications(params?: { skip?: number; limit?: number; is_read?: boolean }): Promise<NotificationResponse[]> {
        try {
            const response = await api.get('/notifications', { params });
            return response.data.items || [];
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return [];
        }
    },

    async getUnreadCount(): Promise<number> {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.unread_count || 0;
        } catch {
            return 0;
        }
    },

    async getRecentActivity(limit: number = 5): Promise<Activity[]> {
        try {
            const response = await api.get('/notifications', {
                params: { limit }
            });

            const notifications = response.data.items || response.data || [];

            // Transform notifications to activity format
            return notifications.map((notification: NotificationResponse) => ({
                id: notification.id,
                type: getActivityType(notification.notification_type || ''),
                title: notification.title || notification.message || 'New update',
                timestamp: formatTimestamp(notification.created_at),
                detail: notification.message
            }));
        } catch (error) {
            console.error('Failed to fetch activity:', error);
            // Return empty array - user may not be logged in
            return [];
        }
    },

    async markAsRead(notificationId: string): Promise<void> {
        await api.put(`/notifications/${notificationId}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await api.put('/notifications/read-all');
    }
};

function getActivityType(notificationType: string): 'price' | 'post' | 'forecast' {
    if (notificationType?.includes('price')) return 'price';
    if (notificationType?.includes('forecast')) return 'forecast';
    if (notificationType?.includes('weather')) return 'forecast';
    return 'post';
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
}
