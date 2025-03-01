import React, { useState } from "react";
import { ChevronDown, Shield } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

const PrivacyPolicy = () => {
  const [openSection, setOpenSection] = useState("collection");

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const Section = ({ id, title, children }) => (
    <div className="mb-4">
      <button
        className="btn btn-light w-100 d-flex justify-content-between align-items-center border shadow-sm p-3"
        onClick={() => toggleSection(id)}
      >
        <span className="fw-semibold">{title}</span>
        <ChevronDown
          className={`transition ${openSection === id ? "rotate-180" : ""}`}
        />
      </button>
      {openSection === id && (
        <div className="p-3 border shadow-sm mt-2 bg-white rounded">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <Shield className="text-primary" size={50} />
        <h1 className="fw-bold mt-2">Privacy Policy</h1>
        <p className="text-muted">Last updated: February 13, 2025</p>
      </div>

      <Section id="collection" title="Information We Collect">
        <p>When you interact with our chatbot, we may collect the following information:</p>
        <ul>
          <li><strong>Personal Information:</strong> Name, phone number, and appointment details.</li>
          <li><strong>Chat Data:</strong> Messages sent to our chatbot.</li>
          <li><strong>Device & Usage Information:</strong> Metadata like timestamps.</li>
        </ul>
      </Section>

      <Section id="usage" title="How We Use Your Information">
        <p>We collect your information for the following purposes:</p>
        <ul>
          <li>To schedule and manage appointments.</li>
          <li>To send reminders and confirmations.</li>
          <li>To improve chatbot performance.</li>
          <li>To comply with legal requirements.</li>
        </ul>
      </Section>

      <Section id="sharing" title="Data Sharing & Security">
        <p>We do not sell or share your data with third parties.</p>
        <p>Your data is stored securely and protected from unauthorized access.</p>
        <p>We comply with WhatsApp’s data privacy policies.</p>
      </Section>

      <Section id="rights" title="User Rights & Contact Information">
        <p>You can request to delete your data by contacting us:</p>
        <p>📧 Email: <a href="mailto:info@meistersolutions.net">info@meistersolutions.net</a></p>
        <p>📍 Address: 4,3A, Asvini Amarisa, Ramapuram, Chennai, TN - 600089</p>
      </Section>

      <Section id="updates" title="Changes to This Privacy Policy">
        <p>We may update this policy periodically. Changes will be reflected on this page.</p>
        <p>By using our chatbot, you agree to this Privacy Policy.</p>
      </Section>
    </div>
  );
};

export default PrivacyPolicy;
