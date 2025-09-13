import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DoctorDashboard.md.css";

// Doctor Components
import MedicalRecordsList from "./MedicalRecordsList";
import AddMedicalRecord from "./AddMedicalRecord";
import PrescriptionsList from "./PrescriptionsList";
import AddPrescription from "./AddPrescription";
import LabRequestsList from "./LabRequestsList";
import AddLabRequest from "./AddLabRequest";
import NotificationsList from "../Notification/NotificationsList";

// Shared
import Profile from "../Profile/DoctorProfile";
import LogoutModal from "../Logout/LogoutModal";

const DoctorDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [showLogout, setShowLogout] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({});
  const [unreadCount, setUnreadCount] = useState(0); // ✅ عداد الإشعارات
  const token = localStorage.getItem("token");

  // ✅ Fetch Doctor Stats
  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/medical-records/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
    }
  };

  // ✅ Fetch Logged-in User
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(res.data);
    } catch (err) {
      console.error("❌ Error fetching user:", err);
    }
  };

  // ✅ Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(res.data);
    } catch (err) {
      console.error("❌ Error fetching unread count:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchStats();
    fetchUnreadCount();

    // ✅ يحدث كل 3 ثواني بدل 10
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // 📊 Statistics Cards
  const statistics = [
    {
      id: 1,
      title: "Prescriptions",
      value: stats.prescriptions || 0,
      icon: "💊",
      color: "#DC2626",
      bgColor: "#F0FDF4",
    },
    {
      id: 2,
      title: "Lab Requests",
      value: stats.labRequests || 0,
      icon: "🧪",
      color: "#059669",
      bgColor: "#FEF3C7",
    },
    {
      id: 3,
      title: "Medical Records",
      value: stats.medicalRecords || 0,
      icon: "📋",
      color: "#1976D2",
      bgColor: "#E3F2FD",
    },
    {
      id: 4,
      title: "Total",
      value:
        (stats.prescriptions || 0) +
        (stats.labRequests || 0) +
        (stats.medicalRecords || 0),
      icon: "📊",
      color: "#7C3AED",
      bgColor: "#F3E8FF",
    },
  ];

  return (
    <div className="doctor-dashboard" dir="ltr">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Doctor Panel</h2>
        </div>

        <nav>
          <div className="nav-sections">
            {/* Dashboard */}
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
                    style={{
                      color:
                        activeView === "dashboard"
                          ? "#FFFFFF"
                          : "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    📊 Main Dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Medical Records */}
            <div className="nav-section">
              <h3>💾 Medical Records</h3>
              <ul>
                <li>
                  <a href="#list" onClick={() => setActiveView("records-list")}>
                    📄 List
                  </a>
                </li>
                <li>
                  <a href="#add" onClick={() => setActiveView("records-add")}>
                    ➕ Add New
                  </a>
                </li>
              </ul>
            </div>

            {/* Prescriptions */}
            <div className="nav-section">
              <h3>💊 Prescriptions</h3>
              <ul>
                <li>
                  <a
                    href="#list"
                    onClick={() => setActiveView("prescriptions-list")}
                  >
                    📄 List
                  </a>
                </li>
                <li>
                  <a
                    href="#add"
                    onClick={() => setActiveView("prescriptions-add")}
                  >
                    ➕ Add New
                  </a>
                </li>
              </ul>
            </div>

            {/* Lab Requests */}
            <div className="nav-section">
              <h3>🧪 Lab Requests</h3>
              <ul>
                <li>
                  <a href="#list" onClick={() => setActiveView("labs-list")}>
                    📄 List
                  </a>
                </li>
                <li>
                  <a href="#add" onClick={() => setActiveView("labs-add")}>
                    ➕ Add New
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="">
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
                    style={{ color: "#FF6B6B" }}
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
          <div className="nav-right">
            <button
              className="notification-btn"
              onClick={() => setActiveView("notifications")}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
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
                  {userInfo?.fullName || "Doctor"}
                </span>
                <span className="user-role">
                  {userInfo?.roles?.[0] || "DOCTOR"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        {activeView === "dashboard" && (
          <>
            <div className="page-header">
              <h1>Doctor Dashboard</h1>
              <p>Manage your medical records, prescriptions, and lab requests</p>
            </div>
            <div className="stats-grid">
              {statistics.map((stat) => (
                <div key={stat.id} className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ backgroundColor: stat.bgColor, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div className="stat-content">
                    <h3>{stat.value}</h3>
                    <p>{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Medical Records */}
        {activeView === "records-list" && <MedicalRecordsList />}
        {activeView === "records-add" && <AddMedicalRecord />}

        {/* Prescriptions */}
        {activeView === "prescriptions-list" && <PrescriptionsList />}
        {activeView === "prescriptions-add" && <AddPrescription />}

        {/* Lab Requests */}
        {activeView === "labs-list" && <LabRequestsList />}
        {activeView === "labs-add" && <AddLabRequest />}

        {/* Profile */}
        {activeView === "profile" && (
          <Profile userInfo={userInfo} setUser={setUserInfo} />
        )}

        {/* Notifications */}
        {activeView === "notifications" && <NotificationsList />}
      </main>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      />
    </div>
  );
};

export default DoctorDashboard;
