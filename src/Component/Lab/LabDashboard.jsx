import React, { useState, useEffect } from "react";
import axios from "axios";
import "./labDashboard.module.css";
import LabRequestList from "./LabRequestList";
import LabProfile from "../Profile/LabProfile";
import LogoutModal from "../Logout/LogoutModal";
import NotificationsList from "../Notification/NotificationsList"; // ✅ استدعاء NotificationsList

const LabDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [showLogout, setShowLogout] = useState(false);

  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ عدد الإشعارات غير المقروءة

  const token = localStorage.getItem("token");

  // ✅ جلب البيانات
  const fetchData = async () => {
    try {
      // 📊 الإحصائيات
      const statsRes = await axios.get("http://localhost:8080/api/labs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsRes.data);

      // 🧪 الطلبات (pending)
      const reqRes = await axios.get("http://localhost:8080/api/labs/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(reqRes.data)
        ? reqRes.data
        : reqRes.data.content || reqRes.data.results || [];
      setRequests(data);

      // 👤 بيانات المستخدم
      const userRes = await axios.get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(userRes.data);

      // 🔔 عدد الإشعارات غير المقروءة
      const notifRes = await axios.get(
        "http://localhost:8080/api/notifications/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUnreadCount(notifRes.data);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="lab-dashboard" dir="ltr">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Lab System</h2>
        </div>

        <nav className="">
          <div className="nav-sections">
            <div className="nav-section">
              <h3>🏠 Dashboard</h3>
              <ul>
                <li>
                  <a
                    href="#dashboard"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("dashboard");
                    }}
                  >
                    📊 Main Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>🧪 Lab Requests</h3>
              <ul>
                <li>
                  <a
                    href="#list"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("requests");
                    }}
                  >
                    📄 Request List
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="nav-bottom">
            <hr className="sidebar-divider" />
            <div className="nav-section">
              <h3>👤 Account</h3>
              <ul>
                <li>
                  <a
                    href="#profile"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("profile");
                    }}
                  >
                    👤 Profile
                  </a>
                </li>
                <li>
                  <a
                    href="#logout"
                    style={{ color: "#E53935" }}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLogout(true);
                    }}
                  >
                    🚪 Logout
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Nav */}
        <header className="top-nav">
          <div className="nav-left">
            <div className="logo">
              <span className="logo-icon"></span>
              <h1 className="logo">Birzeit Insurance</h1>
            </div>
          </div>

          <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* ✅ زر الجرس */}
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => setActiveView("notifications")}
            >
                <button
              className="notification-btn"
              onClick={() => setActiveView("notifications")}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#EF4444",
                    color: "white",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {userInfo && (
              <div className="user-info">
                <div className="user-avatar">
                  <img
                    src={
                      userInfo?.universityCardImage
                        ? userInfo.universityCardImage.startsWith("http")
                          ? userInfo.universityCardImage
                          : `http://localhost:8080${userInfo.universityCardImage}`
                        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    }
                    alt="User Avatar"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {userInfo?.fullName || "User"}
                  </span>
                  <span className="user-role">
                    {userInfo?.roles?.length > 0
                      ? userInfo.roles[0]
                      : "ROLE"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard */}
        {activeView === "dashboard" && stats && (
          <>
            <div className="page-header">
              <h1>Lab Dashboard</h1>
              <p>Manage laboratory test requests</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ backgroundColor: "#FFF7ED", color: "#FB923C" }}
                >
                  ⏳
                </div>
                <div className="stat-content">
                  <h3 style={{ color: "#FB923C" }}>{stats.pending}</h3>
                  <p>Pending</p>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ backgroundColor: "#ECFDF5", color: "#16A34A" }}
                >
                  ✅
                </div>
                <div className="stat-content">
                  <h3 style={{ color: "#16A34A" }}>{stats.completed}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-icon"
                  style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
                >
                  📊
                </div>
                <div className="stat-content">
                  <h3 style={{ color: "#7C3AED" }}>{stats.total}</h3>
                  <p>Total Processed</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Requests */}
        {activeView === "requests" && (
          <LabRequestList
            requests={requests}
            onUploaded={(updatedReq) => {
              setRequests((prev) =>
                prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
              );
              fetchData();
            }}
          />
        )}

        {/* Notifications */}
        {activeView === "notifications" && (
          <NotificationsList refreshUnread={() => fetchData()} />
        )}

        {/* Profile */}
        {activeView === "profile" && (
          <LabProfile
            userInfo={userInfo}
            setUser={setUserInfo}
            refresh={fetchData}
          />
        )}
      </main>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogout}
        onConfirm={() => {
          setShowLogout(false);
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
};

export default LabDashboard;
