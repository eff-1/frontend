import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineModeNight,
  MdOutlineWbSunny,
  MdOutlineSend,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlineReply,
  MdClose,
  MdMenu,
  MdArrowBackIos
} from 'react-icons/md';
import { MdSend } from 'react-icons/md';

import './chat.css'; 

const URL = "https://backend-9a6w.onrender.com";

export const Dashboard = () => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [msgInput, setMsgInput] = useState("");
    const [editInfo, setEditInfo] = useState(null);
    const [editMsg, setEditMsg] = useState("");
    const [replyInfo, setReplyInfo] = useState(null);
    const [selectedChat, setSelectedChat] = useState({ type: "general", data: null });

    const user = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

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

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [selectedChat]);

    useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
}, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!msgInput.trim()) return;

        try {
            const payload = {
                sender_id: user.id,
                message: msgInput,
                replyTo: replyInfo ? replyInfo.id : null
            };
            
            if (selectedChat.type === "general") {
                await axios.post(`${URL}/messages/general`, payload);
            } else if (selectedChat.type === "private") {
                await axios.post(`${URL}/messages/private`, { ...payload, recipient_id: selectedChat.data.id });
            }

            setMsgInput("");
            setReplyInfo(null);
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editMsg.trim()) return;

        try {
            await axios.put(`${URL}/messages/${editInfo.id}`, { message: editMsg });
            setEditInfo(null);
            setEditMsg("");
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${URL}/messages/${id}`);
            fetchMessages();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const getInitials = (name) => {
        if (!name) return "??";
        return name.split(" ").map(n => n[0]).join("").toUpperCase();
    };

    const toggleTheme = () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    };

    const toggleSidebar = () => {
      document.body.classList.toggle('show-sidebar');
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    // useEffect(() => {
    //     const chatElement = messagesEndRef.current?.parentNode;
    //     if (chatElement) {
    //         const isScrolledToBottom = chatElement.scrollHeight - chatElement.clientHeight <= chatElement.scrollTop + 1;
    //         if (isScrolledToBottom) {
    //             messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    //         }
    //     }
    // }, [messages]);

    return (
        <div className="app">
            <div className="topbar">
                <div className="brand">
                    <button className="menu-btn" onClick={toggleSidebar}><MdMenu /></button>
                    {/* <div className="logo">C</div> */}
                      <img 
                //   src="/chats/chatlogs.pm"  
                src="/chats/chatlog.png"
                  alt="logo"  
                  className="m_logo"   
                /> <span className="logtext">hatify</span>
                </div>
                <div className="actions">
                    <button className="icon-btn" onClick={toggleTheme}>
                        <MdOutlineModeNight className="dark-icon" style={{display: document.body.classList.contains('dark') ? 'block' : 'none'}}/>
                        <MdOutlineWbSunny className="light-icon" style={{display: document.body.classList.contains('dark') ? 'none' : 'block'}}/>
                    </button>
                    <button className="icon-btn  text-danger" onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div className="main">
                <aside className="sidebar">
                    <div className="search">
                        <input type="text" placeholder="Search or start a new chat…" />
                    </div>
                    <div className="chats">
                        <div className={`chat-item ${selectedChat.type === 'general' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedChat({ type: "general", data: null });  toggleSidebar()
                            }}
                        >
                            <div className="avatar">GC</div>
                            <div>
                                <div className="name">General Chat</div>
                                <div className="preview">Public messages...</div>
                            </div>
                        </div>
                        {users.map(u => (
                            <div
                                key={u.id}
                                className={`chat-item ${selectedChat.type === 'private' && selectedChat.data.id === u.id ? 'active' : ''}`}
                                onClick={() => { setSelectedChat({ type: "private", data: u }); toggleSidebar();
                                }}
                            >
                                <div className="avatar">{getInitials(u.username)}</div>
                                <div>
                                    <div className="name">{u.username}</div>
                                    <div className="preview">Start a private chat...</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="chat">
                    <div className="chat-header">
                        <button className="go-back-btn" onClick={toggleSidebar}><MdArrowBackIos /></button>
                        <div className="avatar" style={{ width: '38px', height: '38px' }}>
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
                            const replyMessage = m.replyTo ? messages.find(msg => msg.id === m.replyTo) : null;
                            const isEditing = editInfo?.id === m.id;
                            
                            return (
                                    <div key={m.id}className={`msg ${isUserMessage ? 'from-me' : ''} ${replyMessage ? 'reply' : ''}`}>

                                    {isEditing ? (
                                        <form onSubmit={handleEdit}>
                                            <textarea
                                                value={editMsg} onChange={(e) => setEditMsg(e.target.value)}rows="1"style={{ width: '100%' }}   
                                            />
                                            <button type="submit" className="btn secondary">Save</button>
                                            <button type="button" className="btn secondary" onClick={() => setEditInfo(null)}>Cancel</button>
                                        </form>
                                    ) : (
                                        <>
                                            {replyMessage && (
                                                <div className="reply-to">
                                                    <span className="reply-to-text">{isUserMessage ? 'You replied to' : `${m.sender_name} replied to`} {replyMessage.sender_name}: "{replyMessage.message.substring(0, 30)}..."
                                                    </span>
                                                </div>
                                            )}
                                            <div className="bubble">
                                                <span className="sender-name">{isUserMessage ? 'You: ' : `${m.sender_name}: `}</span>
                                                {m.message}
                                            </div>
                                            <div className="meta">
                                                <span>{new Date(m.created_at).toLocaleTimeString()}</span>{isUserMessage && <span> ✓✓</span>}
                                            </div>
                                            <div className="actions">
                                                <button className="icon-btn" onClick={() => setReplyInfo(m)} title="Reply"><MdOutlineReply /></button>
                                                {isUserMessage && (
                                                    <>
                                                       <button className="icon-btn" onClick={() => { setEditInfo(m); setEditMsg(m.message); }}title="Edit"><MdOutlineEdit /> </button>
                                                    </>
                                                )}
                                                <button className="icon-btn" onClick={() => handleDelete(m.id)}title="Delete"><MdOutlineDelete /> </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="composer" onSubmit={handleSendMessage}>
                        {replyInfo && (
                            <div className="composer-reply-pill">
                                <span className="pill-text">Replying to {replyInfo.sender_name}</span>
                                <button type="button" className="close-pill" onClick={() => setReplyInfo(null)}><MdClose /></button>
                            </div>
                        )}
                        <textarea value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={handleKeyDown}placeholder="Message..."rows={replyInfo ? 2 : 1}  />                            
                        <button type="submit" className="send" disabled={!msgInput.trim()}> 
                            <MdSend className="send-icon" />
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};
