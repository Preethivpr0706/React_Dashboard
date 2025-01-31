import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles/SignupPage.css';

const SignupPage = () => {
  const [clients, setClients] = useState([]); // To store client list
  const [selectedClient, setSelectedClient] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState(''); // To store success/failure message
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // To disable the button after successful verification

  // Fetch clients from the database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // If any additional data is required, include it here
        });
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error.message);
      }
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSent(false);
    setMessage('');

    if (!selectedClient || !email) {
      setMessage('Please select a client and enter an email.');
      return;
    }

    try {
      // Send request to verify email
      const response = await fetch('/api/verify-poc-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          email: email,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSent(true);
        setMessage(result.message);
        setIsButtonDisabled(true); // Disable the button after successful verification
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Error verifying email:', error.message);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="sign-up-page">
      <div className="sign-up-card">
        <h1 className="sign-up-title">Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="client">
              Select Your Client
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="form-control"
            >
              <option value="">Select Client</option>
              {clients.map((client) => (
                <option key={client.Client_ID} value={client.Client_ID}>
                  {client.Client_Name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Enter Your Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@xyz.com"
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isButtonDisabled}>
            Verify Your Email
          </button>
          {message && (
            <p className={sent ? 'text-success' : 'text-danger'}>{message}</p>
          )}
          <p>
            Have an account? <Link to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
