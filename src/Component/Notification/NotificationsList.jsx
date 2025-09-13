import React, { useState, useEffect } from "react";
import axios from "axios";

function NotificationsList() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyRecipientId, setReplyRecipientId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [repliedIds, setRepliedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    message: "",
    recipientName: "",
  });

  const token = localStorage.getItem("token");
  const currentUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  // ✅ تحميل الإشعارات
  const fetchNotifications = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const incoming = res.data.filter(
        (n) => n.recipientId === currentUser?.id
      );

      setNotifications(incoming);
      setUnreadCount(
        incoming.filter((n) => !n.read && n.type === "MANUAL_MESSAGE").length
      );
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (!token || !currentUser) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [token, currentUser]);

  // 📌 تغيير الفورم
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ➕ إرسال إشعار جديد
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:8080/api/notifications/by-name",
        { ...form, type: "MANUAL_MESSAGE" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setForm({ message: "", recipientName: "" });
      setShowForm(false);

      setSuccessMessage("✅ تم إرسال الإشعار بنجاح");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error sending notification:", err.response || err);
    }
  };

  // 📖 تعليم كمقروء
  const handleMarkRead = async (id) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/notifications/${id}/read/client`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (err) {
      console.error("❌ Error marking as read:", err);
    }
  };

  // 📖 تعليم الكل كمقروء
  const handleMarkAllRead = async () => {
    try {
      await axios.patch(
        "http://localhost:8080/api/notifications/mark-all-read/client",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setSuccessMessage("✅ تم تعليم جميع الإشعارات كمقروءة");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error marking all as read:", err);
    }
  };

  // 🗑️ حذف إشعار
  const handleDelete = async (id) => {
    try {
      const deleted = notifications.find((n) => n.id === id);
      await axios.delete(
        `http://localhost:8080/api/notifications/${id}/client`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } catch (err) {
      console.error("❌ Error deleting notification:", err);
    }
  };

  // ✉️ فتح الرد
  const handleReplyClick = async (id, senderId) => {
    await handleMarkRead(id);
    setReplyingTo(id);
    setReplyRecipientId(senderId);
    setReplyMessage("");
  };

  // ✉️ إرسال الرد
  const handleReplySubmit = async (id) => {
    try {
      await axios.post(
        `http://localhost:8080/api/notifications/${id}/reply`,
        {
          recipientId: replyRecipientId,
          message: replyMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRepliedIds((prev) => [...prev, id]);
      setReplyingTo(null);
      setReplyRecipientId(null);
      setReplyMessage("");
      setSuccessMessage("✅ تم إرسال الرد بنجاح");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("❌ Error replying to notification:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🔔 Notifications ({unreadCount})</h2>

      {successMessage && <div className="success-msg">{successMessage}</div>}

      {/* ✅ الأزرار فوق الجدول */}
      <div className="top-buttons">
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          ➕ Add Notification
        </button>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="markall-btn">
            📖 Mark All as Read
          </button>
        )}
      </div>

      {/* ✅ فورم الإرسال */}
      {showForm && (
        <div className="chat-box">
          <div className="chat-header">
            <span>💬 Send Notification</span>
            <button onClick={() => setShowForm(false)} className="close-btn">
              ✕
            </button>
          </div>

          <form onSubmit={handleAdd} className="chat-form">
            <textarea
              name="message"
              placeholder="Type your message..."
              value={form.message}
              onChange={handleChange}
              rows="3"
              required
            />
            <input
              type="text"
              name="recipientName"
              placeholder="Recipient Username"
              value={form.recipientName}
              onChange={handleChange}
              required
            />
            <button type="submit" className="send-btn">
              🚀 Send
            </button>
          </form>
        </div>
      )}

      {/* جدول الإشعارات */}
      <table className="notif-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Sender</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => (
            <React.Fragment key={n.id}>
              <tr>
                <td>{n.message}</td>
                <td>{n.senderName || "Unknown"}</td>
                {/* ✅ Status فقط للـ MANUAL_MESSAGE */}
                <td>
                  {n.type === "MANUAL_MESSAGE" &&
                    (n.read ? (
                      <span style={{ color: "green" }}>✔️ Read</span>
                    ) : (
                      <span style={{ color: "red" }}>📩 Unread</span>
                    ))}
                </td>
               <td>
  {new Date(n.createdAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })}{" "}
  {new Date(n.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}
</td>

                {/* ✅ Actions فقط للـ MANUAL_MESSAGE */}
                <td className="actions-cell">
                  {n.type === "MANUAL_MESSAGE" && (
                    <>
                      {!repliedIds.includes(n.id) && replyingTo !== n.id && (
                        <button
                          onClick={() => handleReplyClick(n.id, n.senderId)}
                          className="blue-btn"
                        >
                          ✉️ Reply
                        </button>
                      )}
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="green-btn"
                        >
                          📖 Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="red-btn"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>

              {replyingTo === n.id && (
                <tr>
                  <td colSpan="5">
                    <div className="reply-box">
                      <h3>✉️ Reply to: {n.senderName}</h3>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        rows="3"
                      />
                      <div className="reply-actions">
                        <button
                          onClick={() => handleReplySubmit(n.id)}
                          className="blue-btn"
                        >
                          🚀 Send Reply
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="gray-btn"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* 🎨 CSS */}
      <style>{`
        .success-msg {
          background: #D1FAE5;
          color: #065F46;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: bold;
        }
        .top-buttons {
          display: flex;
          gap: 0.8rem;
          margin: 1rem 0;
        }
        .add-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .markall-btn {
          background: #10B981;
          color: white;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .markall-btn:hover {
          background: #059669;
        }
        .chat-box {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 320px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideUp 0.3s ease;
          overflow: hidden;
        }
        .chat-header {
          background: #059669;
          color: white;
          padding: 0.75rem;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }
        .chat-form textarea,
        .chat-form input {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0.5rem;
          font-size: 0.9rem;
        }
        .send-btn {
          background: #059669;
          color: white;
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .notif-table {
          width: 100%;
          margin-top: 1rem;
          border-collapse: collapse;
        }
        .notif-table th, .notif-table td {
          padding: 0.75rem;
          border-bottom: 1px solid #eee;
          text-align: center;
        }
        .notif-table th {
          background: #f3f4f6;
        }
        .actions-cell {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
        }
        .blue-btn, .green-btn, .red-btn, .gray-btn {
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .blue-btn { background: #2563EB; color: white; }
        .green-btn { background: #10B981; color: white; }
        .red-btn { background: #EF4444; color: white; }
        .gray-btn { background: #6B7280; color: white; }
        .reply-box {
          margin-top: 0.5rem;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f1f5f9;
        }
        .reply-actions {
          display: flex;
          gap: 0.5rem;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default NotificationsList;
