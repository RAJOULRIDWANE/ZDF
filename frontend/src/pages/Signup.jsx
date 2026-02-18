import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import './Auth.css'
import '@fortawesome/fontawesome-free/css/all.min.css';

function Signup() {
  const navigate = useNavigate();

  // 1. State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '' // Laravel requires this exact name
  });

  // 2. State for feedback
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  // 3. Handle Input Changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user types to make UI feel responsive
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // 4. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register', formData);

      console.log("Signup Success:", response.data);

      navigate('/verifyemail', { 
        state: { 
          email: formData.email,
          message: response.data.message 
        }
      });

    } catch (err) {
      console.error("Signup Error:", err);
      setLoading(false);

      if (err.response && err.response.status === 422) {
        // Validation Errors (e.g., Email taken, passwords don't match)
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      } else {
        // Network or Server Errors
        setGeneralError("Something went wrong. Is the server running?");
      }
    }
  };

  return (
    <main className="page-content auth-page">
      <div className="auth-inner">
        <section className="auth-hero">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <h1>Join Us Today!</h1>
            <p>Create your account and bring us your vehicle!</p>
          </div>
        </section>
        
        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-avatar">
              <div className="auth-avatar-icon">
                <i className="fa-regular fa-user"></i>
              </div>
            </div>
            
            <h2>Create Account</h2>
            
            {/* General Error Message */}
            {generalError && (
              <div style={{ 
                color: '#e74c3c', 
                backgroundColor: '#fadbd8',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center' 
              }}>
                {generalError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              
              {/* NAME */}
              <label className="auth-field">
                <span>Full Name</span>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name" 
                  required
                />
                {errors.name && <small style={{color:'red'}}>{errors.name[0]}</small>}
              </label>

              {/* EMAIL */}
              <label className="auth-field">
                <span>Email</span>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email" 
                  required
                />
                {errors.email && <small style={{color:'red'}}>{errors.email[0]}</small>}
              </label>

              {/* PASSWORD */}
              <label className="auth-field">
                <span>Password</span>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password" 
                  required
                />
                {errors.password && <small style={{color:'red'}}>{errors.password[0]}</small>}
              </label>

              {/* CONFIRM PASSWORD */}
              <label className="auth-field">
                <span>Confirm Password</span>
                <input 
                  type="password" 
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password" 
                  required
                />
              </label>

              <button 
                type="submit" 
                className="btn-primary auth-submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign up'}
              </button>
            </form>

            <p className="auth-footer-text">
              Already have an account?{' '} 
              <Link to="/login" className="auth-link-button"> Login </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Signup;