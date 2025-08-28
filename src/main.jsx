import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import { App } from './chat/App';
// import { App } from './chat1/App';
// import App from './App.jsx';
// import { Dashboard } from './seven/Dashboard';
// import { App } from './six/App';
// import {Dashboard} from "./chat1/Dashboard";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    {/* <Dashboard /> */}
    {/* <App /> */}
    {/* <Dashboard /> */}
    {/* <App /> */}
    <App />
  </StrictMode>,
)
