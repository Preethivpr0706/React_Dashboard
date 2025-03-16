import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/EmailVerificationPage.css';
import _ from 'lodash';

const EmailVerificationPage = () => {
  const { token, pocId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const verifyEmail = _.debounce(async () => {
    setLoading(true);

    console.log('Token from URL:', token);
    console.log('POC ID from URL:', pocId);

    try {
      const response = await fetch(`/api/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, pocId }),
      });

      const result = await response.json();

      console.log('API Response:', result);

      if (result.success) {
        setEmail(result.email);
        setMessage(result.message);
        setVerified(true);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred while verifying the email.');
    } finally {
      setLoading(false);
    }
  }, 1000, { leading: true, trailing: false });

  useEffect(() => {
    if (!verified) {
      verifyEmail();
    }
  }, [token, verified]);

  const handleProceed = () => {
    console.log('Navigating to create-password with:', email, pocId);
    navigate('/create-password', { state: { email, pocId } });
  };

  return (
    <div className="email-verification-container">
      <h1 className="email-verification-title">Email Verification</h1>
      <p className="email-verification-message">{message}</p>
      {message === 'Email verified successfully!' && email && (
        <button
          className="proceed-button"
          onClick={handleProceed}
          disabled={loading}
        >
          Proceed to Complete Sign-Up
        </button>
      )}
    </div>
  );
};

export default EmailVerificationPage;
