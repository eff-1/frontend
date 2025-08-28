import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(false); // NEW: loading state

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const messagesEndRef = useRef();
  const lastRef = useRef(null);

  // Protect route: redirect if not logged in
  if (!user) return <Navigate to="/login" />;

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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${URL}/users`);
      setUsers(res.data.filter(u => u.id !== user.id));
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim()){
       alert("Field cannot be empty!");
      return;
    };

    setLoading(true);
    try {
      const payload = { sender_id: user.id, message: msgInput, replyTo: null };
      if (selectedChat.type === "general") {
        await axios.post(`${URL}/messages/general`, payload);
      } else {
        await axios.post(`${URL}/messages/private`, { ...payload, recipient_id: selectedChat.data.id });
      }
      lastRef.current = "load";
      setMsgInput("");
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e, msg) => {
    e.preventDefault();
    const replyText = replyInputs[msg.id];
    if (!replyText || !replyText.trim()) return;

    setLoading(true);
    try {
      const payload = { sender_id: user.id, message: replyText, replyTo: msg.id };
      if (selectedChat.type === "general") {
        await axios.post(`${URL}/messages/general`, payload);
        lastRef.current = "load";
      } else {
        await axios.post(`${URL}/messages/private`, { ...payload, recipient_id: selectedChat.data.id });
      }

      setReplyInputs(prev => ({ ...prev, [msg.id]: "" }));
      setReplyingTo(null);
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editMsg.trim()){
      alert("Field cannot be empty!");
      return;
    };

    setLoading(true);
    try {
      await axios.put(`${URL}/messages/${editInfo.id}`, { message: editMsg });
      setEditInfo(null);
      setEditMsg("");
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${URL}/messages/${id}`);
      await fetchMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
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
                <div>
                  <div className="name">{u.username}</div>
                  <div className="preview">Start a private chat....</div>
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
              </div>
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
                      <input type="text" className=" form-control" value={editMsg} onChange={(e) => setEditMsg(e.target.value)} rows="1" style={{ width: '100%' }} />
                      <button type="submit" className="mt-2 py-2 alert alert-primary"><MdSend /></button>
                      <button type="button" className="ms-5 py-2 alert alert-danger" onClick={() => setEditInfo(null)}><MdClose /></button>
                    </form>
                  ) : (
                    <>
                      {replyMessage && (
                        <div className="reply-preview  text-warning">
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
                        <div className="bubble ">
                          <span className="sender-name">{isUserMessage ? 'You: ' : `${m.sender_name}: `}</span>
                          {m.message}
                        </div>
                        <div className="actions" >
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
                            onChange={(e) => setReplyInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                          />
                          <button type="submit" className="send mt-2 py-2 alert alert-primary" disabled={!replyInputs[m.id]?.trim()}><MdSend /></button>
                          <button type="button" className="close-pill ms-5 py-2 alert alert-danger" onClick={() => setReplyingTo(null)}><MdClose /></button>
                        </form>
                      )}

                      <div className="meta">
                        <span>
                          {new Date(m.created_at).toLocaleString("en-US", {
                            day: "2-digit",
                            month: "short",  // or "long" if you want full month name
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {isUserMessage && <span> ✓✓</span>}
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
            <textarea className=" form-control border border-4" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message..." rows={1} />                            
            <button type="submit" className="send">➤<MdSend className="send-icon" /></button>
             {/* disabled={!msgInput.trim()} */}
          </form>
        </section>
      </div>
    </div>
  );
};
