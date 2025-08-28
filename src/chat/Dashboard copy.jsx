import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Dashboard=()=>{
    const [app, setApp] = useState([]);
    const user = JSON.parse(localStorage.getItem("user"));
    const [msg, setMsg] = useState("");
    const [editInfo, setEditInfo] = useState(null);
    const [editMsg, setEditMsg] = useState("");
    const URL = "http://localhost:4000/app";
    const navigate = useNavigate();
    
 


    const fetchData = async()=>{
        try{
            const res = await axios.get(URL);
            setApp(res.data);
        }catch(err){
            console.log(err);
        };
    };

        useEffect(()=>{
        fetchData();
    }, []);

    const insertData = async()=>{
        if(!msg){
            alert("Field cannot be empty!");
            return;
        };
        try{
            await axios.post(URL, {name:user.username, msg});
            setMsg("");
            fetchData();
        }catch(err){
            console.log(err)
        }
    }

    const editData = async(id, msg)=>{
        try{
            setEditInfo(id);
            setEditMsg(msg);
        }catch(err){
            console.log(err)
        }
    };

    const updateData = async(id)=>{
        if(!editMsg){
            alert("Field cannot be empty!");
            return;
        }
        try{
            await axios.put(URL+id, {msg:editMsg});
            setEditInfo(null);
            setEditMsg("");
            fetchData();
        }catch(err){
            console.log(err)
        }
    }

    const deleteData = async(id)=>{
        try{
            await axios.delete(URL+id);
            fetchData();
        }catch(err){
            console.log(err)
        }
    }

    const logout =()=>{
        localStorage.removeItem("user");
        navigate("/login");
    }



    return(
        <div className="position-relative w-100 p-2 container-fluid d-flex justify-content-center align-items-center flex-column v-100 border shadow rounded" style={{maxWidth:"600px", height:"90vh"}}>
        <div className=" mb-5  overflow-auto w-100" >
        
        <div className="d-flex justify-content-between align-items-center mb-4 fixed-top position-absolute bg-white p-3 shadow">
            <h3>Welcome {user.username}</h3>
            <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
        </div>
    
       <div className="d-flex flex-column mt-5 mb-3 pt-5 ">
         {
            app.map((e)=>{
                const isUser = e.name === user.username;

                return(
                    <div key={e.id} className={` my-2 p-2 rounded ${isUser ? 'align-self-end bg-info' : 'align-self-start bg-secondary text-white'}`} style={{maxWidth:"75%"}}> 
                {
                    editInfo === e.id?(
                        <form onSubmit={(j)=>{
                            j.preventDefault();
                            updateData(e.id);
                        }}>
                        <input type="text" value={editMsg} onChange={(x)=>setEditMsg(x.target.value)} size={40} />
                        <button  className="alert alert-primary py-1 mx-2">Save</button>
                        <button className="alert alert-warning py-1 mx-2" onClick={()=>setEditInfo(null)}>Cancel</button>
                        </form>
                    ):(
                        <>
                       <b>{isUser ? "You": e.name}:</b> <span>{e.message}</span>
                {isUser ? (
                    <button className="alert alert-info py-1 mx-2" onClick={()=>editData(e.id, e.message)}>Edit</button>
                ):null}
                <button className="alert alert-danger py-1 mx-2" onClick={()=>deleteData(e.id)}>Delete</button>
                        </>
                    )
                }
                </div>
                )
            })
        }
       </div>


           <form className="d-flex position-absolute justify-content-between fixed-bottom border border-4 rounded-3" onSubmit={(i)=>{
            i.preventDefault();
            insertData();
        }}>
            <input className="form-control" type="text" placeholder="Enter your message" value={msg} onChange={(x)=>setMsg(x.target.value)} />
            <button className="btn btn-primary px-3 mx-1" type="submit">Submit</button>
        </form>

            </div>
        </div>
    )
};

