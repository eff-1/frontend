import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import "bootstrap/dist/css/bootstrap.min.css";


// import { Dashboard } from '../chat1/Dashboard'
 
// import { MyApp } from './MyApp'
// import App from './App.jsx'
import {App} from "./chat1/App";


createRoot(document.getElementById('root')).render(
  <StrictMode>
  <App />
    {/* <MyApp /> */}
 {/* <Dashboard></Dashboard> */}
  {/* <App /> */}
  {/* <App/> */}
  </StrictMode>
)
