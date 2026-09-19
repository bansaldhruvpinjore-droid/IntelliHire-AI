
import { useCallback, useEffect, useState } from "react";
import API from "./api";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("access_token");

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await API.get("/notifications/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setNotifications(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.notifications)
          ? data.notifications
          : []
      );
    } catch (err) {
      console.error("Notification fetch failed:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      setActionLoading(true);

      await API.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark notification as read failed:", err);
      setError("Unable to update notification.");
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    try {
      setActionLoading(true);

      await API.patch(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error("Mark all notifications as read failed:", err);
      setError("Unable to update notifications.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString();
  };

  return (
    <div className="notification-wrapper">
      <button
        type="button"
        className="notification-bell"
        onClick={() => {
          const nextOpen = !isOpen;
          setIsOpen(nextOpen);

          if (nextOpen) {
            fetchNotifications();
          }
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <span className="notification-bell-icon">♧</span>
        <span className="notification-bell-label">
          Notifications
        </span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>
              <p>
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`}
              </p>
            </div>

            <button
              type="button"
              className="notification-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all"
              onClick={markAllAsRead}
              disabled={actionLoading}
            >
              Mark all as read
            </button>
          )}

          {error && (
            <div className="notification-error">
              {error}
              <button
                type="button"
                onClick={fetchNotifications}
              >
                Retry
              </button>
            </div>
          )}

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-empty">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">
                  ♧
                </span>
                <strong>No notifications yet</strong>
                <p>
                  Updates about your applications will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={
                    notification.is_read
                      ? "notification-item"
                      : "notification-item unread"
                  }
                >
                  <div className="notification-item-content">
                    <div className="notification-item-title">
                      {!notification.is_read && (
                        <span className="notification-unread-dot" />
                      )}

                      <strong>
                        {notification.title || "Notification"}
                      </strong>
                    </div>

                    <p>
                      {notification.message ||
                        "You have a new update."}
                    </p>

                    <span className="notification-date">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="notification-read-button"
                      onClick={() => markAsRead(notification.id)}
                      disabled={actionLoading}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;