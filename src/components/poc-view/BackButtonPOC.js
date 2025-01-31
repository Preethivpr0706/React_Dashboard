import React from 'react';  
import { TbArrowBackUp } from "react-icons/tb";  
import { useNavigate, useLocation } from 'react-router-dom';  
import '../styles/BackButtonPOC.css'
  
const BackButtonPOC = () => {  
  const navigate = useNavigate();  
  const location = useLocation();  
  const pocId = location.state?.pocId;  
  
  const handleBack = () => {  
    navigate("/poc-dashboard",{state: {pocId}}); 
  };  
  
  return (  
   <button className="back-button-poc" onClick={handleBack}>  
    <TbArrowBackUp /> Back
   </button>  
  );  
};  
  
export default BackButtonPOC;
