import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from "react-helmet-async";
import './styles/HomePage.css';
import { 
    FaLinkedinIn, 
    FaTwitter, 
    FaFacebookF, 
    FaInstagram 
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
        <title>Meister Solutions - Software Consulting & Technology Services</title>
        <meta name="description" content="Meister Solutions provides end-to-end software development, Sitecore and BigCommerce expertise, and comprehensive consulting services." />
        <meta name="keywords" content="Software Consulting, Sitecore, BigCommerce, Software Development, Technology Services" />
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
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>End-to-End Software Consulting Solutions</h1>
          <p>Delivering Quality Software Development with Time-to-Market Focus</p>
          <button className="cta-button" onClick={() => scrollToSection('services')}>
            Explore Our Services
          </button>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>About Meister Solutions</h2>
            <div className="underline"></div>
          </div>
          <div className="about-content">
            <div className="about-text">
              <p>
                Meister Solutions is a specialized software consulting firm committed to delivering 
                comprehensive end-to-end software development and implementation services. 
                We focus on quality, time-to-market, and cost-effectiveness.
              </p>
              <p>
                Our expertise spans Sitecore (XP and XM) and BigCommerce technologies, 
                providing solutions from initial consulting through full implementation and ongoing support.
              </p>
            </div>
            <div className="about-image">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8dGVhbSUyMHRlY2hub2xvZ3l8fDB8fHx8MTY5NzgwMDAwMHww&ixlib=rb-4.0.3&q=80&w=1080" 
                alt="Meister Solutions Technology Team" 
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
          
          {/* Sitecore and BigCommerce Services */}
          <div className="service-card technology-services">
            <div className="service-content">
              <h3>Sitecore and BigCommerce Expertise</h3>
              <p>Comprehensive Technology Solutions</p>
              <ul className="benefits-list">
                <li>End-to-end Sitecore (XP and XM) implementation</li>
                <li>BigCommerce technology solutions</li>
                <li>Full-cycle software development consulting</li>
                <li>Strategic technology partnership</li>
              </ul>
              <button className="service-button" onClick={()=> scrollToSection('contact')}>Consult with Experts</button>
            </div>
            <div className="service-image">
              <img 
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8M3x8dGVhbSUyMHRlY2hub2xvZ3l8fDB8fHx8MTY5NzgwMDAwMHww&ixlib=rb-4.0.3&q=80&w=1080https://images.unsplash.com/photo-1573166364902-6d7e7c8048bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTJ8fHNvZnR3YXJlJTIwZGV2ZWxvcG1lbnR8fDB8fHx8MTY5NzgwMDAwMHww&ixlib=rb-4.0.3&q=80&w=1080https://images.unsplash.com/photo-1516321497487-e288fb19713f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8dGVjaG5vbG9neSUyMGNvbnN1bHRpbmd8fDB8fHx8MTY5NzgwMDAwMHww&ixlib=rb-4.0.3&q=80&w=1080https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MXxzZWFyY2h8NHx8dGVjaG5vbG9neSUyMGNvbnN1bHRpbmd8fDB8fHx8MTcwMDg3NTIwMHww&ixlib=rb-4.0.3&q=80&w=1080"
                alt="Technology Consulting Services" 
              />
            </div>
          </div>
          
          {/* Additional Services */}
          <div className="services-grid">
            <div className="service-item">
              <div className="service-icon">
                <i className="fas fa-code"></i>
              </div>
              <h3>Software Development</h3>
              <p>Comprehensive software development services with focus on quality and efficiency.</p>
            </div>
            <div className="service-item">
              <div className="service-icon">
                <i className="fas fa-project-diagram"></i>
              </div>
              <h3>Implementation Support</h3>
              <p>Expert support throughout software implementation and deployment processes.</p>
            </div>
            <div className="service-item">
              <div className="service-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Technology Consulting</h3>
              <p>Strategic technology consulting to drive business growth and innovation.</p>
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
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    placeholder="Your Message" 
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
                <p>123 Business Avenue, Tech City</p>
              </div>
              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <p>contact@meistersolutions.com</p>
              </div>
              <div className="info-item">
                <i className="fas fa-phone"></i>
                <p>+1 (555) 123-4567</p>
              </div>
              
              {/* Updated Social Media Section */}
              <div className="social-links">
                <h4>Connect With Us</h4>
                <div className="social-media-links">
                  <a 
                    href="http://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaLinkedinIn/>
                  </a>
                  <a 
                    href="http://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaTwitter/>
                  </a>
                  <a 
                    href="http://meistersolutions.net/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link"
                  >
                    <FaFacebookF/>
                  </a>
                  <a 
                    href="http://meistersolutions.net/" 
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
          </div>
          <div className="footer-links">
            <ul>
              <li onClick={() => scrollToSection('hero')}>Home</li>
              <li onClick={() => scrollToSection('about')}>About Us</li>
              <li onClick={() => scrollToSection('services')}>Services</li>
              <li onClick={() => scrollToSection('contact')}>Contact Us</li>
            </ul>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2025 Meister Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default HomePage;