import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// ✅ Added imports
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state (passed from Signup)
  const emailFromState = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: emailFromState,
    otp: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Redirect if no email provided
  useEffect(() => {
    if (!emailFromState) {
      navigate('/signup');
    }
  }, [emailFromState, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/verifyemail',
        formData
      );

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Email verified! Please login to continue.' }
        });
      }, 2000);

    } catch (err) {
      console.error('OTP Verification Error:', err);
      setLoading(false);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setResendLoading(true);

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/resend-otp',
        { email: formData.email }
      );

      setSuccess(response.data.message);
      setTimer(60);

    } catch (err) {
      console.error('Resend OTP Error:', err);
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Navbar */}
      <Navbar />

      <main className="page-content auth-page">
        <div className="auth-inner">

          {/* Hero */}
          <section className="auth-hero">
            <div className="auth-hero-overlay" />
            <div className="auth-hero-content">
              <h1>Verify Your Email</h1>
              <p>We've sent a 6-digit code to your email</p>
            </div>
          </section>

          {/* Form */}
          <section className="auth-form-panel">
            <div className="auth-form-card">

              <div className="auth-avatar">
                <div className="auth-avatar-icon">
                  <i className="fa-solid fa-envelope-circle-check"></i>
                </div>
              </div>

              <h2>Enter Verification Code</h2>

              <p className="auth-email-info">
                Code sent to: <strong>{formData.email}</strong>
              </p>

              {error && (
                <div className="auth-alert auth-alert-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="auth-alert auth-alert-success">
                  {success}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>Verification Code</span>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    pattern="\d{6}"
                    required
                    autoFocus
                    className="otp-input"
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={loading || formData.otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <div className="auth-resend-wrapper">
                <p className="auth-resend-text">
                  Didn't receive the code?
                </p>

                {timer > 0 ? (
                  <p className="auth-resend-timer">
                    Resend available in {timer}s
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="auth-resend-btn"
                  >
                    {resendLoading ? 'Sending...' : 'Resend Code'}
                  </button>
                )}
              </div>

              <p className="auth-footer-text auth-footer-spacing">
                Wrong email?{' '}
                <Link to="/signup" className="auth-link-button">
                  Sign up again
                </Link>
              </p>

            </div>
          </section>
        </div>
      </main>

      {/* ✅ Footer */}
      <Footer />
    </>
  );
}

export default VerifyOtp;
