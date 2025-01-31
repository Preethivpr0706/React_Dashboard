import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/ResetPasswordPage.css";

const ResetPasswordPage = () => {
    const { token, pocId } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Password validation
        if (newPassword !== confirmPassword) {
            setMessage("Passwords don't match.");
            return;
        }

        if (!/^[a-zA-Z]/.test(newPassword)) {
            setMessage("Password must start with a letter.");
            return;
        }

        if (newPassword.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }

        if (!/[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/.test(newPassword)) {
            setMessage("Password must contain at least one special character.");
            return;
        }

        if (!/\d/.test(newPassword)) {
            setMessage("Password must contain at least one digit.");
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
            setMessage("Failed to reset password.");
        }
    };

    useEffect(() => {
        let interval = null;
        if (success) {
            interval = setInterval(() => {
                const timer = document.getElementById("timer");
                const time = parseInt(timer.textContent, 10);
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
        <div className="reset-password-container">
            <div className="reset-password-card">
                <h1>Reset Password</h1>
                <form onSubmit={handleResetPassword}>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Reset Password</button>
                </form>
                {message && (
                    <p className={success ? "text-success" : "text-danger"}>{message}</p>
                )}
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

export default ResetPasswordPage;
