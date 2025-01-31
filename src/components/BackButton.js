import React from 'react';  
import { TbArrowBackUp } from "react-icons/tb";  
import { useNavigate, useLocation } from 'react-router-dom';  
import './styles/BackButton.css'
  
const BackButton = () => {  
  const navigate = useNavigate();  
  const location = useLocation();  
  const clientId = location.state?.clientId;  
  const clientName = location.state?.clientName;  
  
  const handleBack = () => {  
   navigate('/admin-dashboard', { state: { clientId, clientName } });  
  };  
  
  return (  
   <button className="back-button-admin" onClick={handleBack}>  
    <TbArrowBackUp /> Back
   </button>  
  );  
};  
  
export default BackButton;
