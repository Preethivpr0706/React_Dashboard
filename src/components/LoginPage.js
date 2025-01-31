import React, { useState, useEffect } from "react";    
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook    
import { Link } from "react-router-dom";    
import "./styles/LoginPage.css";    
    
const LoginPage = () => {    
  const [email, setEmail] = useState("");    
  const [password, setPassword] = useState("");    
  const [role, setRole] = useState("admin");    
  const [clientId, setClientId] = useState(""); 
  const [clientName, setClientName] = useState("");  // To store client name for admin dashboard   
  const [clients, setClients] = useState([]);    
  const [error, setError] = useState("");    
  const navigate = useNavigate();    
    
  const handleLogin = async () => {    
  try {    
  const response = await fetch('/api/poc-login', {    
   method: 'POST',    
   headers: { 'Content-Type': 'application/json' },    
   body: JSON.stringify({ email, password, role, clientId }),    
  });    
    
  const result = await response.json();    
    
  if (result.success) {    
   if (role === 'admin') {    
    navigate("/admin-dashboard", { state: { clientId , clientName} });    
   } else {    
    const pocId = result.pocId;
    navigate("/poc-dashboard/",{state:{ pocId }});    
   }    
  } else {    
   setError(result.message);    
  }    
  } catch (error) {    
  console.error(error);    
  setError('Failed to login.');    
  }    
  };    
    
  const fetchClients = async () => {    
  try {    
  const response = await fetch('/api/clients', {    
   method: 'POST',    
   headers: { 'Content-Type': 'application/json' },    
   body: JSON.stringify({}),    
  });    
  const data = await response.json();    
  setClients(data);    
  } catch (error) {    
  console.error(error);    
  }    
  };    
    
  useEffect(() => {    
  if (role === 'admin') {    
  fetchClients();    
  }    
  }, [role]);    
    
  return (    
  <div className="login-page">    
  <div className="login-form">    
   <h1 className="login-title">Login</h1>    
   <form>    
    <div className="form-group">    
    <label className="form-label" htmlFor="role">    
     Role    
    </label>    
    <select    
     className="form-control"    
     id="role"    
     value={role}    
     onChange={(e) => setRole(e.target.value)}    
    >    
     <option value="admin">Admin</option>    
     <option value="doctor">Doctor</option>    
    </select>    
    </div>    
    {role === 'admin' && (    
    <div className="form-group">    
    <label className="form-label" htmlFor="client">    
      Client    
    </label>    
    <select    
      className="form-control"    
      id="client"    
      value={clientId}    
      onChange={(e) => {
        const selectedOption = e.target.options[e.target.selectedIndex]; // Get the selected option
        setClientId(e.target.value); // Set the client ID
        setClientName(selectedOption.text); // Set the client name
      }}   
    >    
      <option value="">Select Client</option>    
      {clients.map((client) => (    
      <option key={client.Client_ID} value={client.Client_ID}>{client.Client_Name}</option>    
      ))}    
    </select>    
    </div>    
    )}    
    <div className="form-group">    
    <label className="form-label" htmlFor="email">    
     Email    
    </label>    
    <input    
     className="form-control"    
     id="email"    
     type="email"    
     value={email}    
     onChange={(e) => setEmail(e.target.value)}    
    />    
    </div>    
    <div className="form-group">    
    <label className="form-label" htmlFor="password">    
     Password    
    </label>    
    <input    
     className="form-control"    
     id="password"    
     type="password"    
     value={password}    
     onChange={(e) => setPassword(e.target.value)}    
    />    
    </div>    
    <button    
    className="login-button"    
    type="button"    
    onClick={handleLogin}    
    >    
    Login    
    </button>    
    {role === 'doctor' && (   
    <>   
    <p>    
     Don't have an account ? <Link to="/signup"> Sign Up </Link>    
    </p>   
    <p>   
    <Link to="/forgot-password">Forgot Password?</Link>   
    </p>   
    </>   
    )}    
    {error && <div className="login-error">{error}</div>}    
   </form>    
  </div>    
  </div>    
  );    
};    
    
export default LoginPage;
