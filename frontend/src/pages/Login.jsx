import { Link, useNavigate, useLocation } from "react-router-dom"; // ✅ Added useLocation
import { useState } from "react";
import axios from "axios";
import './Auth.css'
import '@fortawesome/fontawesome-free/css/all.min.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ NEW

  // ✅ NEW: Get verification success message
  const verificationMessage = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    console.log("Attempting login with:", email);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', {
        email: email,
        password: password
      });

      console.log("Login Data:", response.data);

      const token = response.data.token;
      const user = response.data.user;

      // --- 1. CLEAR OLD DATA ---
      localStorage.removeItem('ACCESS_TOKEN');
      localStorage.removeItem('USER_NAME');
      localStorage.removeItem('USER_ROLE');

      // --- 2. SAVE TOKEN ---
      localStorage.setItem('ACCESS_TOKEN', token);

      // --- 3. SAVE USER DETAILS INDIVIDUALLY ---
      Object.keys(user).forEach(key => {
        localStorage.setItem(key, user[key]);
      });
      localStorage.setItem('USER_ROLE', user.role);

      // --- 4. REDIRECT ---
      if (user.role === 'client') {
        navigate('/client/dashboard');
      } else if (user.role === 'supervisor') {
        navigate('/supervisor/dashboard');
      } else if (user.role === 'mechanic') {
        navigate('/mechanic/dashboard');
      } else if (user.role === 'receptionist') {
        navigate('/receptionist/dashboard');
      } else if (user.role === 'parts_manager') {
        navigate('/partsmanager/dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error(err);

      // ✅ NEW: Handle unverified users - redirect to OTP page
      if (err.response?.data?.requires_verification) {
        navigate('/verifyemail', {
          state: { email: err.response.data.email }
        });
        return;
      }

      if (err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Network error. Is Laravel running?");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-content auth-page">
      <div className="auth-inner">
        <section className="auth-hero">
          <div className="auth-hero-overlay" />
          <div className="auth-hero-content">
            <h1>Welcome Back!</h1>
            <p>Create your account and bring us your vehicle!</p>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-avatar">
              <div className="auth-avatar-icon">
                <i className="fa-solid fa-user-check"></i>
              </div>
            </div>
            <h2>Welcome Back!</h2>

            {/* ✅ NEW: Verification Success Message */}
            {verificationMessage && (
              <div style={{
                color: '#27ae60',
                backgroundColor: '#d5f4e6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {verificationMessage}
              </div>
            )}

            {/* Display Error Message here */}
            {error && (
              <div style={{
                color: '#e74c3c',
                backgroundColor: '#fadbd8',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleLogin}>
              <label className="auth-field">
                Email
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="auth-field">
                Password
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "ri-eye-close-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </label>

              <div className="auth-extra-row">
                <button type="button" className="auth-link-button small">
                  <Link to="/forgot-password">Forgot password?</Link>
                </button>
              </div>

              <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-footer-text">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link-button"> Sign up </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login;