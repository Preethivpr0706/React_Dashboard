import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from "react-helmet-async";
import './styles/HomePage.css';
import { 
    FaLinkedinIn, 
    FaTwitter, 
    FaFacebookF, 
    FaInstagram,
    FaWhatsapp
  } from 'react-icons/fa';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: false,
    message: ''
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const navigate = useNavigate();

  const handleContactFormChange = (e) => {
    const { id, value } = e.target;
    setContactForm(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/contact', contactForm);
      setSubmitStatus({
        success: true,
        error: false,
        message: 'Message sent successfully!'
      });
      // Reset form after successful submission
      setContactForm({
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        error: true,
        message: 'Failed to send message. Please try again.'
      });
    }
  };

  return (<>
     <Helmet> 
        <title>Meister Solutions - WhatsApp Chatbot & Business Automation Experts</title>
        <meta name="description" content="Meister Solutions provides advanced WhatsApp chatbot solutions, business automation, and digital transformation services. Enhance customer engagement with our powerful WhatsApp Business API solutions." />
        <meta name="keywords" content="WhatsApp Business API, WhatsApp chatbot development, automated customer service, Chatbot for WhatsApp, WhatsApp marketing automation, conversational commerce, WhatsApp message automation, multilingual WhatsApp bot, WhatsApp API integration, business messaging platform, customer engagement chatbot, WhatsApp bot builder" />
        <meta property="og:title" content="Meister Solutions - WhatsApp Chatbot & Business Automation Experts" />
        <meta property="og:description" content="Transform your customer communication with our advanced WhatsApp chatbot solutions and business automation services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://meistercarepanel.site/home" />
      </Helmet>
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="logo">
            <h1>Meister Solutions</h1>
          </div>
          <div className={`menu-icon ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
          <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <li className="nav-item" onClick={() => scrollToSection('hero')}>Home</li>
            <li className="nav-item" onClick={() => scrollToSection('about')}>About Us</li>
            <li className="nav-item" onClick={() => scrollToSection('services')}>Services</li>
            <li className="nav-item" onClick={() => scrollToSection('contact')}>Contact Us</li>
            <li className="nav-item mobile-only" onClick={() => navigate("/chatbot")}>WhatsApp ChatBot</li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Transform Customer Engagement with WhatsApp Chatbots</h1>
          <p>Powerful WhatsApp Business solutions for seamless 24/7 customer communication</p>
          <div className="hero-buttons">
            <button className="cta-button primary" onClick={() => navigate("/chatbot")}>
              Explore WhatsApp ChatBot
            </button>
            <button className="cta-button secondary" onClick={() => scrollToSection('services')}>
              Our Services
            </button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>About Us</h2>
            <div className="underline"></div>
          </div>
          <div className="about-content">
            <div className="about-text">
              <p>
                Meister Solutions specializes in WhatsApp Business API integration and chatbot development, 
                helping businesses automate customer communication and enhance engagement.
              </p>
              <p>
                With our expertise in messaging platforms, we create intelligent 
                WhatsApp chatbots that handle inquiries, support, and transactions - delivering exceptional 
                customer experiences at scale.
              </p>
              <p>
                Our solutions integrate seamlessly with your existing systems, providing a unified 
                communication channel that customers already know and love.
              </p>
            </div>
            <div className="about-image">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                alt="WhatsApp Chatbot Solutions" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Our Specialized Services</h2>
            <div className="underline"></div>
          </div>
          
          {/* WhatsApp Chatbot Service */}
          <div className="service-card chatbot-service">
            <div className="service-content">
              <div className="service-icon">
                <FaWhatsapp size={40} color="#25D366" />
              </div>
              <h3>WhatsApp Business API & Chatbot Solutions</h3>
              <p>Transform customer communication with our powerful WhatsApp solutions</p>
              <ul className="benefits-list">
                <li>WhatsApp Business API integration and approval</li>
                <li>Custom chatbot development for WhatsApp</li>
                <li>24/7 automated customer support and engagement</li>
                <li>Seamless integration with CRM and business systems</li>
                <li>Multilingual support and natural language processing</li>
                <li>Transaction processing and payment integration</li>
              </ul>
              <button className="service-button" onClick={() => navigate("/chatbot")}>
                Get WhatsApp ChatBot Demo
              </button>
            </div>
            <div className="service-image">
              <img 
                src="https://images.unsplash.com/photo-1636051028886-0059ad2383c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                alt="WhatsApp Chatbot Service" 
              />
            </div>
          </div>
          
          {/* Technology Services */}
          <div className="service-card technology-services">
            <div className="service-content">
              <h3>Technology Solutions</h3>
              <p>Comprehensive digital transformation services</p>
              <ul className="benefits-list">
                <li>Sitecore (XP and XM) implementation and development</li>
                <li>BigCommerce technology solutions</li>
                <li>Custom software development</li>
                <li>Business process automation</li>
                <li>API development and integration</li>
              </ul>
              <button className="service-button" onClick={()=> scrollToSection('contact')}>Consult with Experts</button>
            </div>
            <div className="service-image">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                alt="Technology Consulting Services" 
              />
            </div>
          </div>
          
          {/* Additional Services */}
<div className="services-grid">
  <div className="service-item">
    <div className="service-icon">
      <i className="fas fa-cogs"></i>
    </div>
    <h3>Business Automation</h3>
    <p>Streamline operations and reduce costs with smart automation solutions.</p>
  </div>
  <div className="service-item">
    <div className="service-icon">
      <i className="fas fa-project-diagram"></i>
    </div>
    <h3>Integration Services</h3>
    <p>Seamless integration between your business systems and communication platforms.</p>
  </div>
  <div className="service-item">
    <div className="service-icon">
      <i className="fas fa-chart-line"></i>
    </div>
    <h3>Digital Transformation</h3>
    <p>End-to-end digital transformation consulting for business growth.</p>
  </div>
</div>
        </div>
      </section>

      {/* WhatsApp Benefits Section */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Why Choose WhatsApp for Business?</h2>
            <div className="underline"></div>
          </div>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">
                <FaWhatsapp size={30} color="#25D366" />
              </div>
              <h3>98% Open Rate</h3>
              <p>WhatsApp messages have significantly higher open rates compared to email or SMS.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-globe"></i>
              </div>
              <h3>2 Billion+ Users</h3>
              <p>Reach customers on a platform they already use daily.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Conversational Commerce</h3>
              <p>Enable transactions and support within the chat interface.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Automate customer service with instant responses anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <div className="underline"></div>
            <p className="section-subtitle">Ready to transform your business with WhatsApp automation?</p>
          </div>
          <div className="contact-container">
            <div className="contact-form-container">
              <form className="contact-form" onSubmit={handleContactFormSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    placeholder="Your Name" 
                    required 
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="Your Email" 
                    required 
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">How can we help you?</label>
                  <textarea 
                    id="message" 
                    placeholder="Tell us about your WhatsApp automation needs..." 
                    required
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                  ></textarea>
                </div>
                {submitStatus.success && (
                  <div className="success-message">{submitStatus.message}</div>
                )}
                {submitStatus.error && (
                  <div className="error-message">{submitStatus.message}</div>
                )}
                <button type="submit" className="submit-button">Send Message</button>
              </form>
            </div>
            <div className="contact-info">
              <div className="info-item">
                <i className="fas fa-map-marker-alt"></i>
                <p>India: 4,3A, Asvini Amarisa, Ramapuram, Chennai, TN - 600089</p>
              </div>
              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <p>info@meistersolutions.net</p>
              </div>
              <div className="info-item">
                <i className="fas fa-phone"></i>
                <p>+91 9739414675</p>
              </div>
              <div className="info-item whatsapp-contact">
                <FaWhatsapp size={20} />
                <p>+91 9739414675 (WhatsApp Business)</p>
              </div>
              
              <div className="social-links">
                <h4>Connect With Us</h4>
                <div className="social-media-links">
                  <a 
                    href="https://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaLinkedinIn/>
                  </a>
                  <a 
                    href="https://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaTwitter/>
                  </a>
                  <a 
                    href="https://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaFacebookF/>
                  </a>
                  <a 
                    href="https://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaInstagram/>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <h2>Meister Solutions</h2>
            <p>Innovative WhatsApp Automation Solutions</p>
          </div>
          <div className="footer-links">
            <ul>
              <li onClick={() => scrollToSection('hero')}>Home</li>
              <li onClick={() => scrollToSection('about')}>About Us</li>
              <li onClick={() => scrollToSection('services')}>Services</li>
              <li onClick={() => scrollToSection('contact')}>Contact Us</li>
              <li onClick={() => navigate("/chatbot")}>WhatsApp ChatBot</li>
            </ul>
          </div>
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} Meister Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default HomePage;