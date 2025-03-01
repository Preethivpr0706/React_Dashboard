import React, { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const TermsOfService = () => {
  const [openSection, setOpenSection] = useState("introduction");

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const Section = ({ id, title, children }) => (
    <div className="mb-3">
      <button
        className="btn btn-light w-100 d-flex justify-content-between align-items-center p-3 border"
        onClick={() => toggleSection(id)}
        aria-expanded={openSection === id}
      >
        <span className="fw-bold">{title}</span>
        <ChevronDown className={`transition ${openSection === id ? "rotate-180" : ""}`} />
      </button>
      <div className={`collapse ${openSection === id ? "show" : ""}`}>
        <div className="p-3 border">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <FileText className="text-primary" size={50} />
        <h1 className="fw-bold mt-3">Terms of Service</h1>
        <p className="text-muted">Last updated: February 13, 2025</p>
      </div>
      <Section id="introduction" title="Introduction">
        <p>Welcome to our WhatsApp chatbot service. By using our services, you agree to these Terms of Service. Please read them carefully.</p>
      </Section>
      <Section id="services" title="Services Provided">
        <ul>
          <li>Direct Consultation Booking</li>
          <li>Teleconsultation</li>
          <li>Master Health Checkup (Lab Test Booking)</li>
          <li>Emergency Booking</li>
        </ul>
      </Section>
      <Section id="user-responsibilities" title="User Responsibilities">
        <ul>
          <li>Users must provide accurate details when booking an appointment.</li>
          <li>Appointments can be canceled or rescheduled based on doctor availability.</li>
          <li>Misuse of the chatbot for unauthorized activities is strictly prohibited.</li>
        </ul>
      </Section>
      <Section id="payment" title="Payment & Fees">
        <ul>
          <li>Teleconsultation requires upfront payment.</li>
          <li>Direct Consultation & Master Health Checkup allow both online and hospital payments.</li>
          <li>Secure transactions via integrated payment gateways.</li>
        </ul>
      </Section>
      <Section id="liabilities" title="Limitation of Liability">
        <p>We strive for accuracy but cannot guarantee error-free operation. We are not liable for technical issues or incorrect user input.</p>
      </Section>
      <Section id="termination" title="Termination of Service">
        <p>We reserve the right to suspend or terminate access if a user violates these terms.</p>
      </Section>
      <Section id="modifications" title="Changes to These Terms">
        <p>We may update these Terms of Service at any time. Continued use signifies acceptance.</p>
      </Section>
      <Section id="contact" title="Contact Information">
        <p>Email: <a href="mailto:ashok-ceo@meisterwhatsapp.site">ashok-ceo@meisterwhatsapp.site</a></p>
        <p>Address: India: 4,3A, Asvini Amarisa, Ramapuram, Chennai, TN - 600089</p>
      </Section>
      <footer className="text-center text-muted mt-4">&copy; {new Date().getFullYear()} Meister Solutions. All Rights Reserved.</footer>
    </div>
  );
};

export default TermsOfService;
