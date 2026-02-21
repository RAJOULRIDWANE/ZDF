import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from "react-i18next";
import './ForgotPassword.css'; // Reusing the same CSS for consistency

function ResetPassword() {
  const { t } = useTranslation();
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
      setError(t('auth.password_mismatch'));
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
      setError(err.response?.data?.message || t('common.error_occurred'));
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="info-icon" style={{ width: '70px', height: '70px' }}>
            <i className="fa-solid fa-key icon-lock" style={{ fontSize: '45px' }}></i>
          </div>
          <h1>{t('auth.reset_pw_title')}</h1>
          <p>{t('auth.reset_pw_subtitle')}</p>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label>{t('auth.new_password_label')}</label>
            <input
              type="password"
              className="form-input"
              value={password}
              placeholder={t('auth.new_password_placeholder')}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.confirm_password_label')}</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              placeholder={t('auth.confirm_password_placeholder')}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button">{t('auth.reset_button')}</button>
        </form>


      </div>
    </div>
  );
}

export default ResetPassword;
