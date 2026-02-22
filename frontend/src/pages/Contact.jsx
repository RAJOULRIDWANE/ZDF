import axios from 'axios';
import React, { useState } from 'react';
import './Contact.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Contact = () => {

  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  
  // --- UPDATED VALIDATION LOGIC ---
  const validateForm = () => {
    const newErrors = {};

    // 1. Name: Must be OVER 4 characters (5+)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (/\d/.test(formData.name)) {
      newErrors.name = 'Name cannot contain numbers';
    } else if (formData.name.trim().length <= 4) {
      newErrors.name = 'Name must be over 4 characters';
    }

    // 2. Email: Standard validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // 3. Phone: Minimum 10 digits
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits';
      } else if (!/^[\d\s\-+()]+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number can only contain digits, spaces, and - + ( )';
      }
    }

    // 4. Message: Must be OVER 25 characters (26+)
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length <= 25) {
      newErrors.message = 'Message must be over 25 characters';
    }

    return newErrors;
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true); // 👈 disable button

      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      };

      try {
        const res = await axios.post('http://127.0.0.1:8000/api/contact', dataToSend);

        if (res.data.status === 200) {
          setSubmitted(true);
          setFormData({ name: '', email: '', phone: '', message: '' });
          setTimeout(() => setSubmitted(false), 3000);
        }
      } catch (err) {
        console.error("Error sending message:", err);
        if (err.response && err.response.data.errors) {
          setErrors(err.response.data.errors);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };


  return (
    <div className="contact-page">
      <div className="contact-header">
        <div className="contact-header-content">
          <h1>Contact Us</h1>
          <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      <div className="contact-form-section">
        <div className="contact-container">
          <h2>Get In Touch</h2>
          <p className="form-description">
            Fill out the form below and our team will get back to you within 24 hours.
          </p>

          {submitted && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10B981"/>
              </svg>
              <span>Thank you! Your message has been sent successfully.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name <span> * </span> </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address <span> * </span> </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number <span> * </span> </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number (min 10 digits)"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="message">Message <span> * </span> </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help you..."
                rows="6"
                className={errors.message ? 'error' : ''}
              />
              {errors.message && <span className="error-message">{errors.message}</span>}
            </div>

            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="contact-info-grid">
            <div className="contact-info-item">
              <div className="info-icon">
                <i className="fa-solid fa-envelope"></i>
              </div>
              <h3>Email</h3>
              <p>mecapro.info@gmail.com</p>
            </div>

            <div className="contact-info-item">
              <div className="info-icon">
                <i className="fa-solid fa-phone"></i>
              </div>
              <h3>Phone</h3>
              <p>+212 6 66 66 66 66</p>
            </div>

            <div className="contact-info-item">
              <div className="info-icon">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <h3>Location</h3>
              <p>AV.rue 31, selouane, Nador, Morocco</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;