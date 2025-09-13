import React, { useState } from "react";

function AddNotification({ onAdd, isOpen, onClose }) {
  const [form, setForm] = useState({
    message: "",
    sender: "",
    recipient: "",
    type: "MANUAL_MESSAGE",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...form,
      id: Date.now(),
      read: false,
      createdAt: new Date().toLocaleString(),
    });
    setForm({ message: "", sender: "", recipient: "", type: "MANUAL_MESSAGE" });
    onClose(); // ✅ يقفل بعد الإرسال
  };

  if (!isOpen) return null; // ✅ ما يظهر إلا إذا مفتوح

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "320px",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#059669",
          color: "white",
          padding: "0.75rem",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>💬 Send Notification</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: "1.2rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "0.75rem" }}
      >
        <textarea
          name="message"
          placeholder="Type your message..."
          value={form.message}
          onChange={handleChange}
          rows="3"
          required
          style={{ resize: "none", borderRadius: "8px", padding: "0.5rem", border: "1px solid #ccc" }}
        />
        <input
          type="text"
          name="sender"
          placeholder="Sender"
          value={form.sender}
          onChange={handleChange}
          required
          style={{ borderRadius: "8px", padding: "0.5rem", border: "1px solid #ccc" }}
        />
        <input
          type="text"
          name="recipient"
          placeholder="Recipient"
          value={form.recipient}
          onChange={handleChange}
          required
          style={{ borderRadius: "8px", padding: "0.5rem", border: "1px solid #ccc" }}
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          style={{ borderRadius: "8px", padding: "0.5rem", border: "1px solid #ccc" }}
        >
          <option value="MANUAL_MESSAGE">Manual Message</option>
          <option value="CLAIM">Claim</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="SYSTEM">System</option>
        </select>

        <button
          type="submit"
          style={{
            background: "#059669",
            color: "white",
            padding: "0.6rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          🚀 Send
        </button>
      </form>
    </div>
  );
}

export default AddNotification;
