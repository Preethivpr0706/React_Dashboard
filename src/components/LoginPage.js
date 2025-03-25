import React, { useState, useEffect } from "react";    
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";    
import "./styles/LoginPage.css"; // Make sure to update the CSS file with the new styles

const LoginPage = () => {    
  const [email, setEmail] = useState("");    
  const [password, setPassword] = useState("");    
  const [role, setRole] = useState("admin");    
  const [clientId, setClientId] = useState(""); 
  const [clientName, setClientName] = useState("");  
  const [clients, setClients] = useState([]);    
  const [error, setError] = useState("");    
  const navigate = useNavigate();    
    
  const handleLogin = async () => {
    try {
      const response = await fetch("/api/poc-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({ email, password, role, clientId }),
      });

      const result = await response.json();
      console.log(result);

      if (result.success) {
        if (role === "admin") {
          navigate("/admin-dashboard", { state: { clientId, clientName } });
        } else {
          navigate("/poc-dashboard", {state: { pocId: result.pocId}});
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to login. Please try again.");
    }
  };
  
    
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error(error);
        setError("Failed to fetch clients. Please refresh and try again.");
      }
    };

    if (role === "admin") {
      fetchClients();
    }
  }, [role]);  
    
  return (    
    <div className="login-page">    
      <div className="login-form">    
        <h1 className="login-title">Welcome Back</h1>    
        <form>
          {/* Role toggle redesign */}
          <div className="role-toggle">
            <input 
              type="radio" 
              id="admin-role" 
              name="role" 
              value="admin"
              checked={role === 'admin'}
              onChange={() => setRole('admin')}
            />
            <label htmlFor="admin-role">Admin</label>
            
            <input 
              type="radio" 
              id="doctor-role" 
              name="role" 
              value="doctor"
              checked={role === 'doctor'}
              onChange={() => setRole('doctor')}
            />
            <label htmlFor="doctor-role">Doctor</label>
          </div>

          {role === 'admin' && (    
            <div className="form-group">    
              <label className="form-label" htmlFor="client">    
                Select Client    
              </label>    
              <select    
                className="form-control"    
                id="client"    
                value={clientId}    
                onChange={(e) => {
                  const selectedOption = e.target.options[e.target.selectedIndex];
                  setClientId(e.target.value);
                  setClientName(selectedOption.text);
                }}   
              >    
                <option value="">Choose a client</option>    
                {clients.map((client) => (    
                  <option key={client.Client_ID} value={client.Client_ID}>
                    {client.Client_Name}
                  </option>    
                ))}    
              </select>    
            </div>    
          )}    

          <div className="form-group with-icon">    
            <label className="form-label" htmlFor="email">    
              Email Address    
            </label>    
            <input    
              className="form-control"    
              id="email"    
              type="email"    
              value={email}
              placeholder="your.email@example.com"
              onChange={(e) => setEmail(e.target.value)}    
            />    
          </div>    

          <div className="form-group with-icon">    
            <label className="form-label" htmlFor="password">    
              Password    
            </label>    
            <input    
              className="form-control"    
              id="password"    
              type="password"
              placeholder="••••••••"    
              value={password}    
              onChange={(e) => setPassword(e.target.value)}    
            />    
          </div>    

          <button    
            className="login-button"    
            type="button"    
            onClick={handleLogin}    
          >    
            Sign In
          </button>    

          {role === 'doctor' && (   
            <>   
              <p>    
                New user? <Link to="/signup">Create Account</Link>    
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