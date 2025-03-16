import React, { useState, useEffect } from 'react';   
import { useLocation, useNavigate } from 'react-router-dom';   
import './styles/CreatePasswordPage.css';     
  
const CreatePasswordPage = () => {   
  const location = useLocation();   
  const { email, pocId } = location.state || { email: '', pocId: '' };   
  const [password, setPassword] = useState('');   
  const [confirmPassword, setConfirmPassword] = useState('');   
  const [message, setMessage] = useState('');   
  const [success, setSuccess] = useState(false);   
  const navigate = useNavigate();   
  
  const handleSubmit = async (e) => {   
    e.preventDefault();   
  
    if (password !== confirmPassword) {   
      setMessage("Passwords don't match.");   
      return;   
    }   
  
    // Validate password   
    if (!/^[a-zA-Z]/.test(password)) {   
      setMessage('Password must start with a letter.');   
      return;   
    }   
  
    if (password.length < 8) {   
      setMessage('Password must be at least 8 characters long.');   
      return;   
    }   
  
    if (!/[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/.test(password)) {   
      setMessage('Password must contain at least one special character.');   
      return;   
    }   
  
    if (!/\d/.test(password)) {   
      setMessage('Password must contain at least one digit.');   
      return;   
    }   
  
    try {   
      const response = await fetch('/api/update-password', {   
       method: 'POST',   
       headers: { 'Content-Type': 'application/json' },   
       body: JSON.stringify({ email, password, pocId }),   
     });  
  
      const result = await response.json();   
      setMessage(result.message);   
  
      if (result.success) {   
        setSuccess(true);   
        setTimeout(() => {   
         navigate(`/`);  // navigate to login page 
        }, 5000);   
      }   
    } catch (error) {   
      console.error(error);   
      setMessage('Failed to update password.');   
    }   
  };   
  
  useEffect(() => {  
    let interval = null;  
    if (success) {  
     interval = setInterval(() => {  
      const timer = document.getElementById('timer');  
      const time = parseInt(timer.textContent);  
      if (time > 0) {  
        timer.textContent = time - 1;  
      } else {  
        clearInterval(interval);  
      }  
     }, 1000);  
    }  
    return () => clearInterval(interval);  
  }, [success]);  
  
  return (   
    <div className="create-password-container">   
      <div className="create-password-card">   
        <h1>Create Password</h1>   
        <form onSubmit={handleSubmit}>   
          <input   
           type="password"   
           placeholder="Password"   
           onChange={(e) => setPassword(e.target.value)}   
           required   
          />   
          <input   
           type="password"   
           placeholder="Confirm Password"   
           onChange={(e) => setConfirmPassword(e.target.value)}   
           required   
          />   
          <button type="submit">Update Password</button>   
        </form>   
  
        {message && <p className={success ? 'text-success' : 'text-danger'}>{message}</p>}   
  
        {success && (   
         <p className="redirect-message">   
          You will be redirected to the login page in <span id="timer">5</span> seconds.   
         </p>   
        )}   
  
        <div className="password-rules-container">  
         <h3>Password Requirements</h3>  
         <ul>  
          <li>Password must start with a letter.</li>  
          <li>Password must be at least 8 characters long.</li>  
          <li>Password must contain at least one special character (e.g., @, #, $, etc.).</li>  
          <li>Password must contain at least one digit.</li>  
         </ul>  
        </div>  
      </div>   
    </div>   
  );   
};   
  
export default CreatePasswordPage;
