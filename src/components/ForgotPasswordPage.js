import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles/ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setMessage("Please enter your email address.");
            setIsSuccess(false);
            return;
        }
        
        setIsLoading(true);
        
        try {
            const response = await fetch("/api/request-password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
        } catch (error) {
            console.error(error);
            setMessage("Failed to send password reset email. Please try again later.");
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-card">
                <div className="card-header">
                    <h1>Forgot Password</h1>
                </div>
                <div className="card-body">
                    <div className="icon-container">
                        <div className="icon-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>
                    
                    <p className="description">
                        Enter your email address below and we'll send you instructions to reset your password.
                    </p>
                    
                    <form onSubmit={handleForgotPassword}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                className="form-control"
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button 
                            className="submit-button" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Sending..." : "Reset Password"}
                        </button>
                    </form>
                    
                    {message && (
                        <div className={`message-container ${isSuccess ? "text-success" : "text-danger"}`}>
                            {message}
                        </div>
                    )}
                    
                    <div className="back-link">
                        Remember your password? <Link to="/">Back to login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;