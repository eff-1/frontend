import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import io from 'socket.io-client';
import {
  MdOutlineModeNight,
  MdOutlineWbSunny,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineReply,
  MdClose,
  MdMenu,
  MdArrowBackIos
} from 'react-icons/md';
import { MdSend } from 'react-icons/md';

import './chat.css';  

const URL = `${import.meta.env.VITE_API_URL}`;

export const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [editInfo, setEditInfo] = useState(null);
  const [editMsg, setEditMsg] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [selectedChat, setSelectedChat] = useState({ type: "general", data: null });
  const [loading, setLoading] = useState(false);
  
  // Real-time states
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // chatId -> Set of userIds
  const [messageStatuses, setMessageStatuses] = useState({}); // tempId -> status
  const [isTyping, setIsTyping] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const messagesEndRef = useRef();
  const lastRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tempMessageCounter = useRef(0);

  // Protect route: redirect if not logged in
  if (!user) return <Navigate to="/login" />;

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io(URL, {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      socketInstance.emit('user-online', user.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Handle new messages
    socketInstance.on('new-message', (message) => {
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      lastRef.current = "load";
    });

    // Handle message delivery confirmation
    socketInstance.on('message-delivered', ({ tempId, messageId, status }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: messageId, status } 
            : msg
        )
      );
      setMessageStatuses(prev => ({ ...prev, [tempId]: status }));
    });

    // Handle message errors
    socketInstance.on('message-error', ({ tempId, error }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: 'error', error } 
            : msg
        )
      );
    });

    // Handle typing indicators
    socketInstance.on('user-typing', ({ userId, typing, chatType, chatId }) => {
      const currentChatKey = selectedChat.type === 'general' 
        ? 'general' 
        : selectedChat.data?.id;

      const messageChatKey = chatType === 'general' 
        ? 'general' 
        : chatId;

      // Only update typing for current chat
      if (currentChatKey === messageChatKey) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          const chatKey = selectedChat.type === 'general' ? 'general' : selectedChat.data.id;
          
          if (!newMap.has(chatKey)) {
            newMap.set(chatKey, new Set());
          }
          
          const typingSet = newMap.get(chatKey);
          if (typing) {
            typingSet.add(userId);
          } else {
            typingSet.delete(userId);
          }
          
          if (typingSet.size === 0) {
            newMap.delete(chatKey);
          }
          
          return newMap;
        });
      }
    });

    // Handle user status changes
    socketInstance.on('user-status-change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    // Handle message edits
    socketInstance.on('message-edited', (editedMessage) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === editedMessage.id ? editedMessage : msg
        )
      );
    });

    // Handle message deletions
    socketInstance.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user.id]);

  const fetchMessages = async () => {
    try {
      let res;
      if (selectedChat.type === "general") {
        res = await axios.get(`${URL}/messages/general`);
      } else if (selectedChat.type === "private") {
        res = await axios.get(`${URL}/messages/private/${selectedChat.data.id}`, {
          params: { currentUserId: user.id }
        });
      }
      setMessages(res.data);
      // Clear typing indicators when switching chats
      setTypingUsers(new Map());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${URL}/users`);
      const filteredUsers = res.data.filter(u => u.id !== user.id);
      setUsers(filteredUsers);
      
      // Set initial online status
      const initialOnlineUsers = new Set(
        filteredUsers.filter(u => u.isOnline).map(u => u.id)
      );
      setOnlineUsers(initialOnlineUsers);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchMessages(); }, [selectedChat]);

  useEffect(() => {
    if (lastRef.current === "load") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastRef.current = null;
  }, [messages]);

  useEffect(()=>{ lastRef.current = "load"; }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!socket || isTyping) return;
    
    setIsTyping(true);
    socket.emit('typing-start', {
      userId: user.id,
      chatId: selectedChat.type === 'general' ? 'general' : selectedChat.data.id,
      chatType: selectedChat.type,
      recipientId: selectedChat.data?.id
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [socket, isTyping, selectedChat, user.id]);

  const handleTypingStop = useCallback(() => {
    if (!socket || !isTyping) return;
    
    setIsTyping(false);
    socket.emit('typing-stop', {
      userId: user.id,
      chatId: selectedChat.type === 'general' ? 'general' : selectedChat.data.id,
      chatType: selectedChat.type,
      recipientId: selectedChat.data?.id
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isTyping, selectedChat, user.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()) {
      alert("Field cannot be empty!");
      return;
    }

    // Stop typing indicator
    handleTypingStop();

    // Generate temporary ID
    const tempId = `temp-${Date.now()}-${++tempMessageCounter.current}`;
    
    // Optimistic update - show immediately
    const optimisticMessage = {
      id: tempId,
      message: msgInput,
      sender_id: user.id,
      sender_name: user.username,
      created_at: new Date().toISOString(),
      status: 'sending',
      replyto: null
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setMsgInput("");
    lastRef.current = "load";

    // Send via socket
    if (socket) {
      socket.emit('send-message', {
        tempId,
        sender_id: user.id,
        message: msgInput,
        chatType: selectedChat.type,
        recipient_id: selectedChat.data?.id,
        replyTo: null
      });
    } else {
      // Fallback to REST API
      try {
        setLoading(true);
        const payload = { sender_id: user.id, message: msgInput, replyTo: null };
        if (selectedChat.type === "general") {
          await axios.post(`${URL}/messages/general`, payload);
        } else {
          await axios.post(`${URL}/messages/private`, { ...payload, recipient_id: selectedChat.data.id });
        }
        await fetchMessages();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendReply = async (e, msg) => {
    e.preventDefault();
    const replyText = replyInputs[msg.id];
    if (!replyText || !replyText.trim()) return;

    // Stop typing indicator
    handleTypingStop();

    // Generate temporary ID
    const tempId = `temp-${Date.now()}-${++tempMessageCounter.current}`;
    
    // Optimistic update
    const optimisticMessage = {
      id: tempId,
      message: replyText,
      sender_id: user.id,
      sender_name: user.username,
      created_at: new Date().toISOString(),
      status: 'sending',
      replyto: msg.id
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyInputs(prev => ({ ...prev, [msg.id]: "" }));
    setReplyingTo(null);
    lastRef.current = "load";

    // Send via socket
    if (socket) {
      socket.emit('send-message', {
        tempId,
        sender_id: user.id,
        message: replyText,
        chatType: selectedChat.type,
        recipient_id: selectedChat.data?.id,
        replyTo: msg.id
      });
    } else {
      // Fallback to REST API
      try {
        setLoading(true);
        const payload = { sender_id: user.id, message: replyText, replyTo: msg.id };
        if (selectedChat.type === "general") {
          await axios.post(`${URL}/messages/general`, payload);
        } else {
          await axios.post(`${URL}/messages/private`, { ...payload, recipient_id: selectedChat.data.id });
        }
        await fetchMessages();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editMsg.trim()) {
      alert("Field cannot be empty!");
      return;
    }

    if (socket) {
      socket.emit('edit-message', {
        messageId: editInfo.id,
        newMessage: editMsg
      });
      setEditInfo(null);
      setEditMsg("");
    } else {
      // Fallback to REST API
      try {
        setLoading(true);
        await axios.put(`${URL}/messages/${editInfo.id}`, { message: editMsg });
        setEditInfo(null);
        setEditMsg("");
        await fetchMessages();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (socket) {
      socket.emit('delete-message', { messageId: id });
    } else {
      // Fallback to REST API
      try {
        setLoading(true);
        await axios.delete(`${URL}/messages/${id}`);
        await fetchMessages();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getInitials = (name) => !name ? "??" : name.split(" ").map(n => n[0]).join("").toUpperCase();

  const toggleTheme = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  };

  const toggleSidebar = () => { document.body.classList.toggle('show-sidebar'); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setMsgInput(e.target.value);
    handleTypingStart();
  };

  const handleReplyInputChange = (messageId, value) => {
    setReplyInputs(prev => ({ ...prev, [messageId]: value }));
    handleTypingStart();
  };

  // Get typing users for current chat
  const getCurrentChatTypingUsers = () => {
    const chatKey = selectedChat.type === 'general' ? 'general' : selectedChat.data?.id;
    const typingSet = typingUsers.get(chatKey);
    if (!typingSet || typingSet.size === 0) return [];
    
    return Array.from(typingSet)
      .map(userId => users.find(u => u.id === userId))
      .filter(Boolean);
  };

  const currentTypingUsers = getCurrentChatTypingUsers();

  return (
    <div className="app">
      {/* loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-text">Loading...</div>
        </div>
      )}

      {/* topbar */}
      <div className="topbar">
        <div className="brand">
          <button className="menu-btn" onClick={toggleSidebar}><MdMenu /></button>
          <div className="logo d-none d-lg-block px-2">Welcome</div>
          <span>{user.username.toUpperCase()}</span>
        </div>
        <div className="actions mx-1">
          <button className="icon-btn" onClick={toggleTheme}>
            <MdOutlineModeNight className="dark-icon" style={{ display: document.body.classList.contains('dark') ? 'block' : 'none' }} />
            <MdOutlineWbSunny className="light-icon" style={{ display: document.body.classList.contains('dark') ? 'none' : 'block' }} />
          </button>
          <button className="icon-btn text-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main">
        {/* sidebar */}
        <aside className="sidebar">
          <div className="chats">
            <div className={`chat-item ${selectedChat.type === 'general' ? 'active' : ''}`}
              onClick={() => { setSelectedChat({ type: "general", data: null }); toggleSidebar(); }}>
              <div className="avatar">GC</div>
              <div>
                <div className="name">General Chat</div>
                <div className="preview">Public messages...</div>
              </div>
            </div>
            {users.map(u => (
              <div key={u.id} className={`chat-item ${selectedChat.type === 'private' && selectedChat.data.id === u.id ? 'active' : ''}`}
                onClick={() => { setSelectedChat({ type: "private", data: u }); toggleSidebar(); }}>
                <div className="avatar">{getInitials(u.username)}</div>
                <div className="chat-item-info">
                  <div className="name">
                    {u.username}
                    {onlineUsers.has(u.id) && <span className="online-dot"></span>}
                  </div>
                  <div className="preview">
                    {onlineUsers.has(u.id) ? 'Online' : 'Start a private chat...'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* chat section */}
        <section className="chat">
          <div className="chat-header">
            <button className="go-back-btn" onClick={toggleSidebar}><MdArrowBackIos /></button>
            <div className="avatar" style={{ width: 'fit-content', height: '38px' }}>
              {selectedChat.type === 'general' ? 'GC' : selectedChat.data.username}
            </div>
            <div className="title">
              <div className="name">
                {selectedChat.type === 'general' ? 'General Chat' : selectedChat.data.username}
                {selectedChat.type === 'private' && selectedChat.data && onlineUsers.has(selectedChat.data.id) && (
                  <span className="online-dot"></span>
                )}
              </div>
              {/* Typing indicator in header */}
              {currentTypingUsers.length > 0 && (
                <div className="typing-indicator">
                  {currentTypingUsers.length === 1 
                    ? `${currentTypingUsers[0].username} is typing` 
                    : `${currentTypingUsers.length} people are typing`}
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="messages">
            {messages.map(m => {
              const isUserMessage = m.sender_id === user.id;
              const replyMessage = m.replyto ? messages.find(msg => msg.id === m.replyto) : null;
              const isEditing = editInfo?.id === m.id;
              const truncate = (text, length) => text.length > length ? text.slice(0, length) + "..." : text;

              return (
                <div key={m.id} className={`msg ${isUserMessage ? 'from-me' : ''} ${replyMessage ? 'reply' : ''}`}>
                  {isEditing ? (
                    <form onSubmit={handleEdit}>
                      <input type="text" className="form-control" value={editMsg} onChange={(e) => setEditMsg(e.target.value)} rows="1" style={{ width: '100%' }} />
                      <button type="submit" className="mt-2 py-2 alert alert-primary"><MdSend /></button>
                      <button type="button" className="ms-5 py-2 alert alert-danger" onClick={() => setEditInfo(null)}><MdClose /></button>
                    </form>
                  ) : (
                    <>
                      {replyMessage && (
                        <div className="reply-preview text-warning">
                          <i>
                            <div className="reply-preview-header">
                              Replying to: {truncate(replyMessage.sender_id === user.id ? "You" : replyMessage.sender_name, 10)}
                            </div>
                            <div className="reply-preview-message">
                              {truncate(replyMessage.message, 20)}
                            </div>
                          </i>
                        </div>
                      )}

                      <div className="bubble-row">
                        <div className="bubble">
                          <span className="sender-name">{isUserMessage ? 'You: ' : `${m.sender_name}: `}</span>
                          {m.message}
                        </div>
                        <div className="actions">
                          {!isUserMessage && (
                            <button style={{backgroundColor:"bisque"}} className="icon-btn text-black" onClick={() => setReplyingTo(m)} title="Reply"><MdOutlineReply /></button>
                          )}
                          {isUserMessage && (
                            <button style={{backgroundColor:"bisque"}} className="icon-btn text-black" onClick={() => { setEditInfo(m); setEditMsg(m.message); }} title="Edit"><MdOutlineEdit /></button>
                          )}
                          <button style={{backgroundColor:"bisque"}} className="icon-btn text-danger mx-3" onClick={() => handleDelete(m.id)} title="Delete"><MdOutlineDelete /></button>
                        </div>
                      </div>

                      {replyingTo?.id === m.id && (
                        <form className="reply-box" onSubmit={(e) => handleSendReply(e, m)}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`Reply to ${m.sender_name}...`}
                            value={replyInputs[m.id] || ""}
                            onChange={(e) => handleReplyInputChange(m.id, e.target.value)}
                          />
                          <button type="submit" className="send mt-2 py-2 alert alert-primary" disabled={!replyInputs[m.id]?.trim()}><MdSend /></button>
                          <button type="button" className="close-pill ms-5 py-2 alert alert-danger" onClick={() => setReplyingTo(null)}><MdClose /></button>
                        </form>
                      )}

                      <div className="meta">
                        <span>
                          {new Date(m.created_at).toLocaleString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {isUserMessage && (
                          <span className={`message-status ${m.status || 'sent'}`}>
                            {m.status === 'sending' && ' ⏳'}
                            {m.status === 'sent' && ' ✓'}
                            {m.status === 'delivered' && ' ✓✓'}
                            {m.status === 'error' && ' ❌'}
                            {!m.status && ' ✓✓'}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* main composer */}
          <form className="composer" onSubmit={handleSendMessage}>
            <textarea 
              className="form-control border border-4" 
              value={msgInput} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} 
              placeholder="Message..." 
              rows={1} 
            />                            
            <button type="submit" className="send">➤<MdSend className="send-icon" /></button>
          </form>
        </section>
      </div>
    </div>
  );
};