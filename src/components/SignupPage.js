import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles/SignupPage.css';

const SignupPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch clients from the database
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.Client_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSent(false);
    setMessage('');

    if (!selectedClient || !email) {
      setMessage('Please select a client and enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      setIsButtonDisabled(true);
      // Visual feedback while processing
      setMessage('Verifying your email...');
      
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
      } else {
        setMessage(result.message);
        setIsButtonDisabled(false);
      }
    } catch (error) {
      console.error('Error verifying email:', error.message);
      setMessage('An error occurred. Please try again later.');
      setIsButtonDisabled(false);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleClientChange = (e) => {
    setSelectedClient(e.target.value);
    setSearchTerm('');
  };

  const selectedClientName = clients.find(client => client.Client_ID === selectedClient)?.Client_Name || '';

  return (
    <div className="signup-container">
      <div className="signup-content">
        <div className="signup-header">
          <h1>Create Your Account</h1>
          <p>Join our healthcare platform to access your patient data securely</p>
        </div>

        <div className="signup-form-container">
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label htmlFor="client">Healthcare Provider</label>
              <div className="select-wrapper">
                {selectedClient ? (
                  <div className="selected-client">
                    <span>{selectedClientName}</span>
                    <button 
                      type="button" 
                      className="change-btn"
                      onClick={() => setSelectedClient('')}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="Search for your healthcare provider"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                      <span className="search-icon">🔍</span>
                    </div>
                    <div className="client-list">
                      {isLoading ? (
                        <div className="loading-spinner">Loading providers...</div>
                      ) : filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <div 
                            key={client.Client_ID} 
                            className="client-option"
                            onClick={() => {
                              setSelectedClient(client.Client_ID);
                              setSearchTerm('');
                            }}
                          >
                            {client.Client_Name}
                          </div>
                        ))
                      ) : (
                        <div className="no-results">No providers found</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`form-input ${email ? 'has-value' : ''}`}
                />
                <span className="input-icon">✉️</span>
              </div>
            </div>

            <button 
              type="submit" 
              className={`signup-btn ${isButtonDisabled ? 'disabled' : ''}`}
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ? 'Verifying...' : 'Verify Email'}
            </button>

            {message && (
              <div className={`message-container ${sent ? 'success' : 'error'}`}>
                <span className="message-icon">{sent ? '✓' : '!'}</span>
                <p>{message}</p>
              </div>
            )}
          </form>
        </div>

        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
      
      <div className="signup-background">
        <div className="signup-illustration">
          <div className="illustration-content">
            <h2>Secure Healthcare Access</h2>
            <p>Join thousands of healthcare professionals using our platform to manage patient care efficiently.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;