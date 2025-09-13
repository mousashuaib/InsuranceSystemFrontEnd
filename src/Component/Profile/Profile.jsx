import React, { useState } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = ({ userInfo, setUser }) => {
  const [formData, setFormData] = useState({
    username: userInfo?.username || "",
    fullName: userInfo?.fullName || "",
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
    universityCardImage: userInfo?.universityCardImage || "",
    file: null, // الملف المؤقت
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ تعديل النصوص
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ تعديل الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        file: file,
        universityCardImage: preview, // عرض الصورة مؤقتًا
      }));
    }
  };

  // ✅ حفظ البيانات
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const form = new FormData();
      form.append(
        "data",
        new Blob(
          [
            JSON.stringify({
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
            }),
          ],
          { type: "application/json" }
        )
      );
      if (formData.file) {
        form.append("universityCard", formData.file);
      }

      const res = await axios.patch(
        "http://localhost:8080/api/Clients/me/update",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ✅ تحديث الـ state + localStorage
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));

      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Error updating profile:", err.response || err);
      alert("Error updating profile ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <span className="profile-icon">👤</span>
          <h2>Profile</h2>
        </div>

        {/* الصورة */}
        <div className="profile-avatar-wrapper">
          <label
            htmlFor="imageUpload"
            style={{ cursor: isEditing ? "pointer" : "default" }}
          >
            <img
              src={
                formData.universityCardImage
                  ? formData.universityCardImage.startsWith("blob:")
                    ? formData.universityCardImage
                    : `http://localhost:8080${formData.universityCardImage}`
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
              alt="Profile"
              className="profile-avatar"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </label>
          {isEditing && (
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          )}
        </div>

        {/* معلومات المستخدم */}
        <div className="profile-info-grid">
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={formData.username} readOnly />
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              readOnly={!isEditing}
            />
          </div>

          {/* إضافات ثابتة */}
          <div className="form-group">
            <label>Status</label>
            <span className="badge active">ACTIVE</span>
          </div>

          <div className="form-group">
            <label>Role</label>
            <span className="badge role">
              {userInfo?.roles?.[0] || "INSURANCE_CLIENT"}
            </span>
          </div>

          <div className="form-group">
            <label>Created At</label>
            <span>{userInfo?.createdAt || "N/A"}</span>
          </div>

          <div className="form-group">
            <label>Updated At</label>
            <span>{userInfo?.updatedAt || "N/A"}</span>
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="profile-actions">
          {!isEditing ? (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </button>
          ) : (
            <button className="edit-btn" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
