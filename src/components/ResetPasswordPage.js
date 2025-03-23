import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/ResetPasswordPage.css";

const ResetPasswordPage = () => {
    const { token, pocId } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    // Password validation states
    const [validations, setValidations] = useState({
        hasLetter: false,
        hasLength: false,
        hasSpecial: false,
        hasDigit: false,
        passwordsMatch: false
    });

    useEffect(() => {
        // Check password requirements
        const newValidations = {
            hasLetter: /^[a-zA-Z]/.test(newPassword),
            hasLength: newPassword.length >= 8,
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword),
            hasDigit: /\d/.test(newPassword),
            passwordsMatch: newPassword === confirmPassword && newPassword !== ""
        };
        
        setValidations(newValidations);
        
        // Calculate password strength (0-4)
        const strength = Object.values(newValidations).filter(Boolean).length;
        setPasswordStrength(strength);
    }, [newPassword, confirmPassword]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Check if password meets all requirements
        if (!validations.hasLetter || !validations.hasLength || 
            !validations.hasSpecial || !validations.hasDigit || 
            !validations.passwordsMatch) {
            setMessage("Please ensure your password meets all requirements.");
            return;
        }

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, pocId, newPassword }),
            });
            const result = await response.json();

            setMessage(result.message);
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate("/");
                }, 5000); // Redirect after 5 seconds
            }
        } catch (error) {
            console.error(error);
            setMessage("Failed to reset password. Please try again later.");
        }
    };

    useEffect(() => {
        let interval = null;
        if (success) {
            interval = setInterval(() => {
                const timer = document.getElementById("timer");
                if (timer) {
                    const time = parseInt(timer.textContent, 10);
                    if (time > 0) {
                        timer.textContent = time - 1;
                    } else {
                        clearInterval(interval);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [success]);

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="card-header">
                    <h1>Reset Your Password</h1>
                    <p className="subtitle">Create a strong, secure password for your account</p>
                </div>
                
                <form onSubmit={handleResetPassword}>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-container">
                            <input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={newPassword ? "active" : ""}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-input-container">
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={confirmPassword ? "active" : ""}
                                required
                            />
                        </div>
                    </div>

                    {newPassword && (
                        <div className="password-strength-meter">
                            <div className="strength-label">Password Strength:</div>
                            <div className="strength-bars">
                                <div className={`strength-bar ${passwordStrength >= 1 ? "active" : ""} ${passwordStrength === 1 ? "weak" : ""}`}></div>
                                <div className={`strength-bar ${passwordStrength >= 2 ? "active" : ""} ${passwordStrength === 2 ? "fair" : ""}`}></div>
                                <div className={`strength-bar ${passwordStrength >= 3 ? "active" : ""} ${passwordStrength === 3 ? "good" : ""}`}></div>
                                <div className={`strength-bar ${passwordStrength >= 4 ? "active" : ""} ${passwordStrength === 4 ? "strong" : ""}`}></div>
                            </div>
                            <div className="strength-text">
                                {passwordStrength === 0 && "Very Weak"}
                                {passwordStrength === 1 && "Weak"}
                                {passwordStrength === 2 && "Fair"}
                                {passwordStrength === 3 && "Good"}
                                {passwordStrength === 4 && "Strong"}
                            </div>
                        </div>
                    )}
                    
                    <div className="password-requirements">
                        <h3>Password Requirements</h3>
                        <ul>
                            <li className={validations.hasLetter ? "valid" : "invalid"}>
                                <span className="indicator"></span> Start with a letter
                            </li>
                            <li className={validations.hasLength ? "valid" : "invalid"}>
                                <span className="indicator"></span> At least 8 characters long
                            </li>
                            <li className={validations.hasSpecial ? "valid" : "invalid"}>
                                <span className="indicator"></span> Include at least one special character (e.g., @, #, $)
                            </li>
                            <li className={validations.hasDigit ? "valid" : "invalid"}>
                                <span className="indicator"></span> Include at least one digit
                            </li>
                            <li className={validations.passwordsMatch ? "valid" : "invalid"}>
                                <span className="indicator"></span> Passwords match
                            </li>
                        </ul>
                    </div>
                    
                    <button type="submit" className="reset-button">Reset Password</button>
                </form>
                
                {message && (
                    <div className={`message ${success ? "success" : "error"}`}>
                        {message}
                    </div>
                )}
                
                {success && (
                    <div className="redirect-message">
                        <div className="redirect-icon">✓</div>
                        <p>You will be redirected to the login page in <span id="timer">5</span> seconds.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;