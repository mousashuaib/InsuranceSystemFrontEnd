// ✅ src/Component/Chat/UserChat.jsx
import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import { api, getToken } from "../../utils/apiService";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import logger from "../../utils/logger";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  IconButton,
  CircularProgress,
  Paper,
  Tooltip,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";
import ChatHeader from "./ChatHeader";

let stompClient = null;

const UserChat = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef(null);

  // ✅ Get user info from localStorage
  const currentUserId = localStorage.getItem("userId");
  const token = getToken();

  // ✅ Check login data before running anything
  useEffect(() => {
    if (!currentUserId || !token) {
      logger.log("Missing userId or token in localStorage.");
      setError("Please log in again. Missing authentication data.");
      return;
    }

    const socket = new SockJS(`${API_BASE_URL}${API_ENDPOINTS.CHAT.WEBSOCKET}`);
    stompClient = over(socket);
    stompClient.connect({}, onConnected, onError);

    return () => {

      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => logger.log("WebSocket disconnected"));
      }
    };
  }, []);

  // ✅ WebSocket connection success
  const onConnected = () => {
    logger.log("Connected to WebSocket server");
    setConnected(true);

    setTimeout(() => {
      if (stompClient.connected && currentUserId) {
        const destination = `/user/${currentUserId}/queue/messages`;
        stompClient.subscribe(destination, onMessageReceived);
        logger.log("Subscribed to:", destination);
      }
    }, 300);
  };

  const onError = (err) => {
    logger.error("WebSocket error:", err);
    setConnected(false);
  };

  const onMessageReceived = (payload) => {
    const body = JSON.parse(payload.body);
    if (
      activeUser &&
      (body.senderId === activeUser.id || body.receiverId === activeUser.id)
    ) {
      setMessages((prev) => [...prev, body]);
    }
  };

  // ✅ Fetch Users (Exclude Insurance Clients)
  useEffect(() => {
    if (!currentUserId || !token) return;

    setLoading(true);
    setError("");

    // api.get returns response.data directly
    api
      .get(`${API_ENDPOINTS.CHAT.USERS}?currentUserId=${currentUserId}`)
      .then((usersData) => {
        const filtered = (usersData || []).filter(
          (u) =>
            u.id !== currentUserId &&
            !u.roles?.some((r) => r.name === "INSURANCE_CLIENT")
        );
        setUsers(filtered);
      })
      .catch((err) => {
        logger.error("Failed to load users:", err);
        setError(
          err.response?.status === 403
            ? "Access denied. Please log in again."
            : "Failed to load users. Please try later."
        );
      })
      .finally(() => setLoading(false));
  }, [currentUserId]);

  // ✅ Open Chat
  const openChat = async (u) => {
    setActiveUser(u);
    setMessages([]);
    setLoading(true);

    try {
      // api.get returns response.data directly
      const conversationsData = await api.get(`${API_ENDPOINTS.CHAT.MESSAGES}/conversations/${currentUserId}`);

      const conv = (conversationsData || []).find((c) =>
        c.messages?.some(
          (m) =>
            (m.senderId === u.id && m.receiverId === currentUserId) ||
            (m.receiverId === u.id && m.senderId === currentUserId)
        )
      );

      if (conv) setMessages(conv.messages);
    } catch (err) {
      logger.error("Error loading conversation:", err);
      setError("Error loading chat conversation.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Send Message
  const sendMessage = () => {
    if (!message.trim() || !activeUser || !connected) return;

    const msg = {
      senderId: currentUserId,
      receiverId: activeUser.id,
      content: message.trim(),
    };

    stompClient.send("/app/chat.sendPrivateMessage", {}, JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
    setMessage("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ UI
  return (
    <Box
    
      dir="ltr"
      sx={{
        display: "flex",
        height: "100vh",
        background: "linear-gradient(145deg, #f7f9fb 0%, #eef3f9 100%)",
        fontFamily: "Inter, Cairo, sans-serif",
      }}
    >
      {/* Sidebar - Users List */}
      <Paper
        elevation={4}
        sx={{
          width: { xs: "35%", md: "25%", lg: "22%" },
          background: "#ffffff",
          borderRight: "3px solid #1E8EAB",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            background: "#1E8EAB",
            color: "white",
            textAlign: "center",
            py: 2,
            fontWeight: "bold",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Available Users
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ mt: 4 }}
          >
            No users found
          </Typography>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {users.map((u) => (
              <Paper
                key={u.id}
                onClick={() => openChat(u)}
                elevation={activeUser?.id === u.id ? 6 : 1}
                sx={{
                  p: 1.5,
                  mb: 1.2,
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "14px",
                  cursor: "pointer",
                  bgcolor:
                    activeUser?.id === u.id
                      ? "rgba(30,142,171,0.15)"
                      : "transparent",
                  "&:hover": { bgcolor: "rgba(30,142,171,0.08)" },
                  transition: "0.25s",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "#1E8EAB",
                    color: "#fff",
                    mr: 1.5,
                    fontWeight: "bold",
                    fontSize: "0.95rem",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  }}
                >
                  {u.fullName ? u.fullName.charAt(0).toUpperCase() : "?"}
                </Avatar>
                <Box>
                  <Typography fontWeight="bold" color="#1E8EAB">
                    {u.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {u.department || u.faculty || "Medical Entity"}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          sx={{
            background: "#1E8EAB",
            color: "#fff",
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}>
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography fontWeight="bold" fontSize="1.1rem">
              Chat Center – Birzeit Health Insurance System
            </Typography>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            p: 3,
            overflowY: "auto",
            background: "#f5f8fa",
          }}
        >
          {activeUser ? (
            loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </Box>
            ) : messages.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" mt={5}>
                No messages yet
              </Typography>
            ) : (
              messages.map((m, i) => {
                const isMine = m.senderId === currentUserId;
                return (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      mb: 1.2,
                    }}
                  >
                    <Tooltip
                      title={
                        m.sentAt
                          ? new Date(m.sentAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: "14px",
                          maxWidth: "70%",
                          bgcolor: isMine ? "#1E8EAB" : "#e1e8ef",
                          color: isMine ? "#fff" : "#000",
                          fontSize: "0.95rem",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        {m.content}
                      </Box>
                    </Tooltip>
                  </Box>
                );
              })
            )
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.secondary",
                flexDirection: "column",
                opacity: 0.85,
              }}
            >
              <Typography variant="h6" mb={1}>
                Select a user to start chatting 💬
              </Typography>
              <Typography variant="body2">
                Birzeit Health Insurance System
              </Typography>
            </Box>
          )}
          <div ref={chatEndRef}></div>
        </Box>

        {/* Message Input */}
        {activeUser && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              background: "#fff",
              borderTop: "1px solid #ddd",
              boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              sx={{
                background: "#f7f9fc",
                borderRadius: "12px",
                "& fieldset": { border: "none" },
                fontSize: "0.95rem",
              }}
            />
            <IconButton
              onClick={sendMessage}
              sx={{
                bgcolor: "#1E8EAB",
                color: "white",
                ml: 1.2,
                "&:hover": { bgcolor: "#176b86" },
                width: 48,
                height: 48,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserChat;
