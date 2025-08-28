import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const [app, setApp] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const [msg, setMsg] = useState("");
  const [editInfo, setEditInfo] = useState(null);
  const [editMsg, setEditMsg] = useState("");
  const [replyInfo, setReplyInfo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const URL = "http://localhost:4000/app";
  const navigate = useNavigate();

  const bottomRef = useRef();
  // track last action: "send" | "reply" | null
  const lastActionRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(URL);
      setApp(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



// When `app` changes, check lastActionRef to decide whether to scroll.
useEffect(() => {
  if (lastActionRef.current === "load") {
    bottomRef.current?.scrollIntoView();
  }
  // clear the action after handling it
  lastActionRef.current = null;
}, [app]);

// ✅ Set this when the page loads
useEffect(() => {
  lastActionRef.current = "load";
}, []);


  const insertData = async () => {
    if (!msg) {
      alert("Field cannot be empty!");
      return;
    }
    try {
      await axios.post(URL, { name: user.username, msg });
      setMsg("");

      lastActionRef.current = "load";
      await fetchData();

    } catch (err) {
      console.log(err);
    }
  };

  const editData = (id, msg) => {
    setEditInfo(id);
    setEditMsg(msg);
  };

  const updateData = async (id) => {
    if (!editMsg) {
      alert("Field cannot be empty!");
      return;
    }
    try {
      await axios.put(URL + id, { msg: editMsg });
      setEditInfo(null);
      setEditMsg("");
     
      await fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteData = async (id) => {
    try {
      await axios.delete(URL + id);
      await fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const openReply = (id) => {
    setReplyInfo(id);
  };

  const sendReply = async (id) => {
    if (!replyText) {
      alert("Field cannot be empty!!!");
      return;
    }
    try {
      await axios.post(URL + "Reply" + id, { name: user.username, msg: replyText });
      setReplyText("");
      setReplyInfo(null);
      lastActionRef.current = "load";
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      className="position-relative w-100 p-2 container-fluid d-flex justify-content-center align-items-center flex-column v-100 border shadow rounded"
      style={{ maxWidth: "600px", height: "90vh" }}
    >
      <div className="mb-5 overflow-auto w-100 messages-container" style={{ height: "100%" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 fixed-top position-absolute bg-white p-3 shadow">
          <h3>Welcome {user.username}</h3>
          <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
        </div>

        <div className="d-flex flex-column mt-5 mb-3 pt-5">
          {app.map((e) => {
            const isUser = e.name === user.username;
            const replyOriginal = e.replyTo ? app.find((m) => m.id === e.replyTo) : null;

            return (
              <div
                id={`msg-${e.id}`}
                key={e.id}
                className={`my-2 p-2 rounded ${isUser ? "align-self-end bg-info" : "align-self-start bg-secondary text-white"}`}
                style={{ maxWidth: "75%" }}
              >
                {editInfo === e.id ? (
                  <form
                    onSubmit={(j) => {
                      j.preventDefault();
                      updateData(e.id);
                    }}
                  >
                    <input
                      type="text"
                      value={editMsg}
                      onChange={(x) => setEditMsg(x.target.value)}
                      size={40}
                      className="form-control mb-1"
                    />
                    <button className="alert alert-primary py-1 mx-2">Save</button>
                    <button
                      type="button"
                      className="alert alert-warning py-1 mx-2"
                      onClick={() => setEditInfo(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div>
                    {replyOriginal && (
                      <>
                        <i className=" alert alert-danger py-1 my-1 d-inline-block">
                          Replying to {replyOriginal.name}:{" "}
                          {replyOriginal.message.length > 30 ? replyOriginal.message.slice(0, 30) + "..." : replyOriginal.message}
                        </i>
                        <br />
                      </>
                    )}
                    <b>{isUser ? "You" : e.name}:</b> <span>{e.message}</span>
                   
                    {isUser && (
                      <button className="alert alert-info py-1 mx-2" onClick={() => editData(e.id, e.message)}>
                        Edit
                      </button>
                    )}
                    <button className="alert alert-danger py-1 mx-2" onClick={() => deleteData(e.id)}>
                      Delete
                    </button>

                    {!isUser && (
                      <div>
                        <button onClick={() => openReply(e.id)} className="btn btn-success">
                          Reply
                        </button>
                      </div>
                    )}
                    {replyInfo === e.id && (
                      <form
                        className="mt-1"
                        onSubmit={(a) => {
                          a.preventDefault();
                          sendReply(e.id);
                        }}
                      >
                        <input
                          type="text"
                          placeholder={`Reply to ${e.name}`}
                          className="form-control"
                          value={replyText}
                          onChange={(x) => setReplyText(x.target.value)}
                        />
                        <div className="m-1">
                          <button type="submit" className="btn alert alert-success py-1 mx-2">Reply</button>
                          <button type="button" onClick={() => setReplyInfo(null)} className="btn alert alert-warning py-1">Cancel</button>
                        </div>
                      </form>
                      
                    )}
                     <span className=" d-inline-block" >{e.created_at}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        <form
          className="d-flex position-absolute justify-content-between fixed-bottom border border-4 rounded-3"
          onSubmit={(i) => {
            i.preventDefault();
            insertData();
          }}
        >
          <input
            className="form-control"
            type="text"
            placeholder="Enter your message"
            value={msg}
            onChange={(x) => setMsg(x.target.value)}
          />
          <button className="btn btn-primary px-3 mx-1" type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};
