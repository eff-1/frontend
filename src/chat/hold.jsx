// dashboard    


import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Dashboard=()=>{
    const [app, setApp] = useState([]);
    const URL = `${import.meta.env.VITE_API_URL}/app`;
      const user = JSON.parse(localStorage.getItem("user"));
      const navigate = useNavigate();

    const fetchData = async()=>{
        try{
            const res = await axios.get(URL);
            setApp(res.data);
        }catch(err){
            console.log(err.response?.data?.error);
        };
    };

    const logout=()=>{
        localStorage.removeItem("user");
        navigate("/login")
    }

    useEffect(()=>{
        fetchData();
    }, []);

    return(
        <>
        <h1>My App</h1>
        <button onClick={logout}>Logout</button><br /><br />
        {
            app.map((e)=>(
                <li key={e.id}>
                    {/* <b>{e.name}:</b> <i>{e.message}</i> */}
                    <b>{user.username == e.name ? e.name = "Me" : e.name}:</b>  <i>{e.message}</i>
                </li>
            ))
        }
        </>
    )
}
// enddashnoard

// startserver.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");
const route = require("./routes/authRoute");

const PORT = process.env.PORT || 5000;  

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(route);

app.get("/app", (req, res)=>{
    db.query("SELECT * FROM tasks", (err, result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json(result);
    });
});

app.listen(PORT, ()=>{
    console.log("Listening on port", PORT);
}); 
// endsever

// auth
const express = require("express");
const db = require("../db");

const route = express.Router();

route.post("/signup", (req, res)=>{
    const {username, password} = req.body;
    const query = "INSERT INTO users2 (username, password) VALUE(?, ?)";
    db.query(query, [username, password], (err, result)=>{
        if(err.code === "ER_DUP_ENTRY") return res.status(400).json({error:"Username already exist!"});
         if(err) return res.status(500).json({error:err.message});
        res.status(201).json({id:result.insertId});
    });
});

    route.post("/login", (req, res)=>{
        const {username, password} = req.body;
        const query = "SELECT * FROM users2 WHERE username = ? AND password = ?";
        db.query(query, [username, password], (err, result)=>{
             if(err) return res.status(500).json({error:err.message});
             if(result.length === 0) return res.status(401).json({error:"Incorrect email or password"});

             const user = result[0];
             res.json({user: {id:user.id, username:user.username}});
        })
    })

module.exports = route;
// endauth

// ➤