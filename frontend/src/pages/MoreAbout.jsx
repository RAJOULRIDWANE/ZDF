import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MoreAbout.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const MoreAbout = () => {
  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ma-v2-wrapper">
      
      {/* 1. Minimalist Hero */}
      <header className="ma-v2-hero">
        <div className="ma-v2-hero-content">
          <span className="ma-v2-subtitle">EST. 2022</span>
          <h1>Auto Repair, <span className="text-blue">Reimagined.</span></h1>
          <p>We are building the most trusted automotive brand in the region.</p>
        </div>
      </header>

      {/* 2. The "Old Way vs New Way" Comparison */}
      <section className="ma-v2-comparison">
        <div className="ma-v2-container">
          <div className="ma-v2-grid-2col">
            <div className="ma-v2-text-block">
              <h2>Why we are different</h2>
              <p>
                The traditional mechanic experience is often filled with uncertainty. 
                We designed MecaPro to eliminate the guesswork.
              </p>
              
              <div className="comparison-list">
                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>Vague estimates & surprise fees</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>Digital quotes approved by you first</span>
                </div>

                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>Dirty waiting rooms & delays</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>Clean facility & strict scheduling</span>
                </div>

                <div className="comparison-item bad">
                  <i className="fa-solid fa-xmark"></i>
                  <span>"It looks fine" diagnostics</span>
                </div>
                <div className="comparison-item good">
                  <i className="fa-solid fa-check"></i>
                  <span>Data-driven computer diagnostics</span>
                </div>
              </div>
            </div>
            
            <div className="ma-v2-image-block">
               {/* Placeholder for an image of a mechanic using a tablet/computer */}
               <div className="image-placeholder-tech">
                 <i className="fa-solid fa-laptop-medical"></i>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Standards (Dark Section) */}
      <section className="ma-v2-standards">
        <div className="ma-v2-container">
          <div className="standards-header">
            <h2>Our Core Standards</h2>
            <div className="blue-bar"></div>
          </div>
          
          <div className="standards-grid">
            <div className="standard-card">
              <div className="card-number">01</div>
              <h3>OEM Quality</h3>
              <p>We never compromise on parts. We use Original Equipment Manufacturer (OEM) or high-grade equivalent parts to ensure your warranty remains valid.</p>
            </div>
            
            <div className="standard-card">
              <div className="card-number">02</div>
              <h3>Tech-First</h3>
              <p>Modern cars are computers on wheels. We invest heavily in the latest diagnostic software for European, Asian, and American models.</p>
            </div>
            
            <div className="standard-card">
              <div className="card-number">03</div>
              <h3>Cleanliness</h3>
              <p>We respect your vehicle. Seat covers, floor mats, and steering wheel covers are used on every single job to keep your interior pristine.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA */}
      <section className="ma-v2-cta">
        <div className="ma-v2-cta-content">
          <h2>Experience the difference today.</h2>
          <div className="ma-v2-buttons">
             <Link to="/contact" className="btn-solid">Book Appointment</Link>
             <Link to="/" className="btn-outline">Return Home</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default MoreAbout;