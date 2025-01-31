import React, { useState } from "react";
import "./styles/ForgotPasswordPage.css";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(null); 

    const handleForgotPassword = async () => {
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
            setMessage("Failed to send password reset email.");
            setIsSuccess(false);
        }
    };

    return (
        <div className="forgot-password-page">
            <div className="forgot-password-form">
                <h1>Forgot Password</h1>
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

                <button className="forgot-button" onClick={handleForgotPassword}>
                    Send Reset Link
                </button>

                {message && (
                    <p className={isSuccess ? "text-success" : "text-danger"}>{message}</p>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
