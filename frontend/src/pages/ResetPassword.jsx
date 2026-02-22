import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css'; // Reusing the same CSS for consistency

function ResetPassword() {
  const { token } = useParams(); // Get token from URL path
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email'); // Get email from URL query

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmPassword
      });

      setMessage(res.data.message);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="info-icon" style={{ width: '70px', height: '70px' }}>
            <i className="fa-solid fa-key icon-lock" style={{ fontSize: '45px' }}></i>
          </div>
          <h1>Set New Password</h1>
          <p>Create a strong password for your account.</p>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              placeholder='Set New Password'
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              placeholder='Confirm New Password'
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button">Reset Password</button>
        </form>


      </div>
    </div>
  );
}

export default ResetPassword;