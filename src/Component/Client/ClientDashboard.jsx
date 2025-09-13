import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ClientDashboard.css";

// Client Components
import MyPrescriptions from "./MyPrescriptions";
import MyLabRequests from "./MyLabRequests";
import MyClaims from "./MyClaims";
import AddClaim from "./AddClaim";
import MyEmergencyRequests from "./MyEmergencyRequests";
import AddEmergency from "./AddEmergency";
import ClientMedicalRecord from "./ClientMedicalRecord";

// Notifications
import NotificationsList from "../Notification/NotificationListClient";

// Shared
import Profile from "../Profile/Profile";
import LogoutModal from "../Logout/LogoutModal";

const ClientDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [showLogout, setShowLogout] = useState(false);
  const [user, setUser] = useState(null);

  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [claims, setClaims] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);

  // ✅ Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ البحث
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const token = localStorage.getItem("token");

  // ✅ fetch user from /auth/me
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("❌ Error fetching user:", err);
    }
  };

  // ✅ Prescriptions
  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/prescriptions/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrescriptions(res.data);
    } catch (err) {
      console.error("❌ Error fetching prescriptions:", err);
    }
  };

  // ✅ Labs
  const fetchLabs = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/labs/getByMember", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLabRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetching lab requests:", err);
    }
  };

  // ✅ Claims
  const fetchClaims = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/claims/allClaimForOneMember",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaims(res.data);
    } catch (err) {
      console.error("❌ Error fetching claims:", err);
    }
  };

  // ✅ Emergencies
  const fetchEmergencies = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/emergencies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmergencyRequests(res.data);
    } catch (err) {
      console.error("❌ Error fetching emergencies:", err);
    }
  };

  // ✅ Unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/notifications/unread-count",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(res.data);
    } catch (err) {
      console.error("❌ Error fetching unread count:", err);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchUser();
    fetchPrescriptions();
    fetchLabs();
    fetchClaims();
    fetchEmergencies();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [token]);

  // ✅ Verify Prescription
  const handleVerify = async (id) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/prescriptions/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrescriptions((p) =>
        p.map((pr) => (pr.id === id ? { ...pr, status: "VERIFIED" } : pr))
      );
    } catch (err) {
      console.error("❌ Error verifying:", err);
    }
  };

  // ❌ Reject Prescription
  const handleReject = async (id) => {
    try {
      await axios.patch(
        `http://localhost:8080/api/prescriptions/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrescriptions((p) =>
        p.map((pr) => (pr.id === id ? { ...pr, status: "REJECTED" } : pr))
      );
    } catch (err) {
      console.error("❌ Error rejecting:", err);
    }
  };

  // 📊 إحصائيات
  const statistics = [
    {
      id: 1,
      title: "Pending Prescriptions",
      value: prescriptions.filter((p) => p.status === "PENDING").length,
      icon: "💊",
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      id: 2,
      title: "Lab Requests",
      value: labRequests.length,
      icon: "🧪",
      color: "#7C3AED",
      bgColor: "#F3E8FF",
    },
    {
      id: 3,
      title: "My Claims",
      value: claims.length,
      icon: "📋",
      color: "#1976D2",
      bgColor: "#E3F2FD",
    },
    {
      id: 4,
      title: "Emergency Requests",
      value: emergencyRequests.length,
      icon: "🚨",
      color: "#DC2626",
      bgColor: "#FEF2F2",
    },
  ];

  // ✅ Search
  const handleSearch = async () => {
    try {
      let url = "";
      let params = {};

      if (searchType && !searchQuery) {
        url = "http://localhost:8080/api/search-profiles/by-type";
        params = { type: searchType };
      } else if (searchType && searchQuery) {
        url = "http://localhost:8080/api/search-profiles/by-name-type";
        params = { name: searchQuery, type: searchType };
      } else if (!searchType && searchQuery) {
        url = "http://localhost:8080/api/search-profiles/by-name";
        params = { name: searchQuery };
      } else {
        return;
      }

      const res = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults(res.data);
    } catch (err) {
      console.error("❌ Error searching profiles:", err);
    }
  };

  // 🎨 Styles by type
  const typeStyles = {
    CLINIC: { bg: "#ECFDF5", color: "#059669", icon: "🏥" },
    PHARMACY: { bg: "#EFF6FF", color: "#2563EB", icon: "💊" },
    LAB: { bg: "#FEF3C7", color: "#D97706", icon: "🧪" },
    EMERGENCY: { bg: "#FEF2F2", color: "#DC2626", icon: "🚨" },
    DEFAULT: { bg: "#F3F4F6", color: "#374151", icon: "📌" },
  };

  return (
    <div className="client-dashboard" dir="ltr">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Client Portal</h2>
        </div>
        <nav className="sidebar-nav">
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
                    style={{
                      color:
                        activeView === "dashboard"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    📊 Main Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>💊 Prescriptions</h3>
              <ul>
                <li>
                  <a
                    href="#my-prescriptions"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("prescriptions");
                    }}
                    style={{
                      color:
                        activeView === "prescriptions"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    📄 My Prescriptions
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>🧪 Lab Requests</h3>
              <ul>
                <li>
                  <a
                    href="#my-lab-requests"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("lab");
                    }}
                    style={{
                      color:
                        activeView === "lab"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    📋 My Lab Requests
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>📋 Claims</h3>
              <ul>
                <li>
                  <a
                    href="#my-claims"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("claims");
                    }}
                    style={{
                      color:
                        activeView === "claims"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    📋 My Claims
                  </a>
                </li>
                <li>
                  <a
                    href="#add-claims"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("add-claims");
                    }}
                    style={{
                      color:
                        activeView === "add-claims"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    ➕ Add Claim
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>🚨 Emergency</h3>
              <ul>
                <li>
                  <a
                    href="#emergency-requests"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("emergency");
                    }}
                    style={{
                      color:
                        activeView === "emergency"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    ⚡ Emergency Requests
                  </a>
                </li>
                <li>
                  <a
                    href="#add-emergency"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("add-emergency");
                    }}
                    style={{
                      color:
                        activeView === "add-emergency"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    ➕ Add Emergency
                  </a>
                </li>
              </ul>
            </div>

            <div className="nav-section">
              <h3>📖 Medical</h3>
              <ul>
                <li>
                  <a
                    href="#medical-records"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView("medical");
                    }}
                    style={{
                      color:
                        activeView === "medical"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    📖 My Medical Records
                  </a>
                </li>
              </ul>
            </div>

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
                    style={{
                      color:
                        activeView === "profile"
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.9)",
                    }}
                  >
                    👤 Profile
                  </a>
                </li>
                <li>
                  <a
                    href="#logout"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLogout(true);
                    }}
                    style={{ color: "#FF6B6B" }}
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
        <header className="top-nav">
          <div className="nav-left">
            <div className="logo">
              <h1>Birzeit Insurance</h1>
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
                    user?.universityCardImage
                      ? user.universityCardImage.startsWith("http")
                        ? user.universityCardImage
                        : `http://localhost:8080${user.universityCardImage}`
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
                <span className="user-name">{user?.fullName || "Client"}</span>
                <span className="user-role">{user?.roles?.[0] || "CLIENT"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conditional Rendering */}
        {activeView === "dashboard" && (
          <>
            <div className="page-header">
              <h1>Client Dashboard</h1>
              <p>Overview of your insurance activity</p>

              {/* 🔍 Search Section */}
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9CA3AF",
                    }}
                  >
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 1rem 0.6rem 2.2rem",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#F9FAFB",
                      color: "#111827",
                    }}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  style={{
                    backgroundColor: "#7C3AED",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.6rem 1.2rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* 📊 Status Cards */}
            <div className="stats-grid">
              {statistics.map((stat) => (
                <div key={stat.id} className="stat-card">
                  <div
                    className="stat-icon"
                    style={{
                      backgroundColor: stat.bgColor,
                      color: stat.color,
                    }}
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

            {/* ✅ Search Results */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: "2rem" }}>
                <h2 style={{ marginBottom: "1rem" }}>Search Results</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {searchResults.map((profile) => {
                    const style = typeStyles[profile.type] || typeStyles.DEFAULT;
                    return (
                      <div
                        key={profile.id}
                        style={{
                          background: style.bg,
                          color: style.color,
                          padding: "1rem",
                          borderRadius: "12px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <h3 style={{ marginBottom: "0.5rem" }}>
                          {style.icon} {profile.name}
                        </h3>
                        <p>
                          <b>Type:</b> {profile.type}
                        </p>
                        <p>
                          <b>Address:</b> {profile.address}
                        </p>
                        <p>
                          <b>Contact:</b> {profile.contactInfo}
                        </p>
                        <p>
                          <b>Owner:</b> {profile.ownerName}
                        </p>
                        <p style={{ fontSize: "0.9rem" }}>{profile.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeView === "prescriptions" && (
          <MyPrescriptions
            prescriptions={prescriptions}
            onVerify={handleVerify}
            onReject={handleReject}
          />
        )}

        {activeView === "lab" && <MyLabRequests labRequests={labRequests} />}
        {activeView === "claims" && <MyClaims claims={claims} />}
        {activeView === "add-claims" && (
          <AddClaim onAdded={(newClaim) => setClaims((prev) => [...prev, newClaim])} />
        )}

        {activeView === "emergency" && (
          <MyEmergencyRequests
            emergencyRequests={emergencyRequests}
            setEmergencyRequests={setEmergencyRequests}
          />
        )}
        {activeView === "add-emergency" && (
          <AddEmergency
            onAdded={(newEmergency) =>
              setEmergencyRequests((prev) => [...prev, newEmergency])
            }
          />
        )}
        {activeView === "medical" && <ClientMedicalRecord user={user} />}
        {activeView === "profile" && <Profile userInfo={user} setUser={setUser} />}

        {/* Notifications */}
        {activeView === "notifications" && <NotificationsList />}
      </main>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      />
    </div>
  );
};

export default ClientDashboard;
