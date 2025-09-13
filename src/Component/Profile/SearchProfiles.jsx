import React, { useState } from "react";
import axios from "axios";

const SearchProfiles = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!searchQuery) return;

      const res = await axios.get(
        "http://localhost:8080/api/search-profiles/by-name",
        {
          params: { name: searchQuery },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("❌ Error searching profiles:", err);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      {/* Search Input */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search clinics, pharmacies, labs, emergencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "0.6rem 1rem",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
          }}
        />
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
          🔍 Search
        </button>
      </div>

      {/* Results as Cards */}
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
            {searchResults.map((profile) => (
              <div
                key={profile.id}
                style={{
                  background: "#fff",
                  padding: "1rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ color: "#7C3AED", marginBottom: "0.5rem" }}>
                  {profile.name}
                </h3>
                <p><b>Type:</b> {profile.type}</p>
                <p><b>Address:</b> {profile.address}</p>
                <p><b>Contact:</b> {profile.contactInfo}</p>
                <p><b>Owner:</b> {profile.ownerName}</p>
                <p style={{ fontSize: "0.9rem", color: "#6B7280" }}>
                  {profile.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchProfiles;
