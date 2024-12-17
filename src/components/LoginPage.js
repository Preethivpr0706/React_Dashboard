import React, { useState } from "react";  
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook  
import { Link } from "react-router-dom";  
import "./LoginPage.css";  
  
const LoginPage = () => {  
  const [email, setEmail] = useState("");  
  const [password, setPassword] = useState("");  
  const [role, setRole] = useState("admin");  
  const [error, setError] = useState("");  
  const navigate = useNavigate();  
  
  const handleLogin = async () => {  
   try {  
    const response = await fetch('/api/poc-login', {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ email, password, role }),  
    });  
  
    const result = await response.json();  
  
    if (result.success) {  
      if (role === 'admin') {  
       navigate("/admin-dashboard");  
      } else {  
       navigate(`/poc-dashboard/${result.pocId}`);  
      }  
    } else {  
      setError(result.message);  
    }  
   } catch (error) {  
    console.error(error);  
    setError('Failed to login.');  
   }  
  };  
  
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
        <p>  
          Don't have an account ? <Link to="/signup"> Sign Up </Link>  
        </p>  
       )}  
       {error && <div className="login-error">{error}</div>}  
      </form>  
    </div>  
   </div>  
  );  
};  
  
export default LoginPage;
