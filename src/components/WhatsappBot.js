import React from 'react';

const WhatsappBot = () => {
  const containerStyle = {
    fontFamily: 'Arial, sans-serif',
    padding: '30px',
    backgroundColor: '#f4f4f4',
    color: '#333',
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const headerStyle = {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#6c63ff',
    color: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  };

  const sectionStyle = {
    margin: '30px 0',
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  };

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  };

  const cardStyle = {
    backgroundColor: '#6c63ff',
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s',
  };

  const cardHoverStyle = {
    transform: 'translateY(-10px)',
  };

  const footerStyle = {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#6c63ff',
    color: '#fff',
    borderRadius: '12px',
    marginTop: '30px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  };

  const contactStyle = {
    padding: '30px',
    backgroundColor: '#e8e8e8',
    borderRadius: '12px',
    marginTop: '30px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1>Hospital Appointment Chatbot</h1>
        <p>Seamlessly book appointments and manage your schedules through WhatsApp.</p>
      </header>

      <section style={sectionStyle}>
        <h2>Why Use Our Chatbot?</h2>
        <div style={cardGridStyle}>
          <div style={cardStyle}>24/7 Availability: Book appointments anytime, anywhere.</div>
          <div style={cardStyle}>User-Friendly: No complex apps — just use WhatsApp.</div>
          <div style={cardStyle}>Instant Notifications: Get real-time updates about your appointments.</div>
          <div style={cardStyle}>Secure: Your data is safe and confidential.</div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Key Features</h2>
        <div style={cardGridStyle}>
          <div style={cardStyle}>Book Appointments: Schedule hospital appointments quickly and easily.</div>
          <div style={cardStyle}>Real-Time Updates: Get confirmations, reminders, and status updates.</div>
          <div style={cardStyle}>Two-Way Communication: Reschedule or cancel appointments effortlessly.</div>
          <div style={cardStyle}>Personalized Reminders: Never miss an appointment again.</div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>How It Works</h2>
        <ol>
          <li>Start a chat by clicking the WhatsApp icon.</li>
          <li>Select a service — booking, rescheduling, or canceling appointments.</li>
          <li>Receive real-time confirmations and reminders.</li>
          <li>Engage in live chat with our AI-powered bot.</li>
        </ol>
      </section>

      <section style={contactStyle}>
        <h2>Contact Us</h2>
        <p>Need help or have questions? Reach out to us!</p>
        <p>Email: info@meistersolutions.net</p>
        <p>Phone: +91 97394 14675</p>
      </section>

      <footer style={footerStyle}>
        <p>Powered by Meister Solutions | Hospital Appointment Chatbot</p>
      </footer>
    </div>
  );
};

export default WhatsappBot;