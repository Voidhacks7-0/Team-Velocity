import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  message: string;
  description?: string;
  link?: string;
  type: string;
  created_at: string;
  isRead: boolean;
  createdBy?: {
    name: string;
    role: string;
  } | null;
};

export function NotificationBell() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async (silent = false) => {
    if (!token) return;
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await apiRequest<NotificationItem[]>("/common/notifications", { token });
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchNotifications(true);
    }
  }, [open]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchNotifications(true), 60000);
    return () => clearInterval(interval);
  }, [token]);

  const hasUnread = notifications.some((n) => !n.isRead);

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await apiRequest(`/common/notifications/${notification.id}/read`, {
          method: "POST",
          token,
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      }
      if (notification.link) {
        setOpen(false);
        navigate(notification.link);
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Stay in sync with campus updates</p>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchNotifications} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">You're all caught up!</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition hover:bg-muted ${
                  notification.isRead ? "opacity-70" : "border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{notification.message}</p>
                  {!notification.isRead && <Badge variant="default">New</Badge>}
                </div>
                {notification.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {notification.description}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

