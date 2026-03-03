import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Home.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import PartnerCarousel from "../components/PartnerCarousel";


function Home({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <main className="page-content home-page">
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-inner">
          <div className="hero-text">
            <h1>
              {t("home.hero_title")}
            </h1>
            <p>
              {t("home.hero_subtitle")}
            </p>
            <div className="hero-actions">
              <button type="button" className="btn-primary">  {' '} <Link to="/login"> {t("home.get_started")} </Link>
              </button>
              <button type="button" className="btn-outline" > {' '} <Link to="/contact"> {t("home.call_us")} </Link>
              </button>
            </div>
          </div>
          <div className="hero-visual">
  {/* The "Back Window" for extra depth */}
  <div className="mockup-bg-layer"></div>

  <div className="dashboard-mockup-v2">
    {/* High-tech scanline overlay */}
    <div className="scanline"></div>
    
    <div className="mockup-header">
      <div className="dots"><span></span><span></span><span></span></div>
      <div className="mockup-title">MecaPro OS v2.0 _</div>
    </div>
    
    <div className="mockup-body">
      <div className="mockup-sidebar">
        <i className="fa-solid fa-layer-group active"></i>
        <i className="fa-solid fa-screwdriver-wrench"></i>
        <i className="fa-solid fa-microchip"></i>
        <i className="fa-solid fa-gear"></i>
      </div>

      <div className="mockup-content">
        <div className="status-header">
          <span>Diagnostic Monitor</span>
          <div className="pulse-dot-blue"></div>
        </div>
        
        {/* Item 1: Completed */}
        <div className="mockup-list-item">
          <div className="item-icon"><i className="fa-solid fa-check" style={{color: '#10b981'}}></i></div>
          <div className="item-text">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line long"></div>
          </div>
          <div className="status-badge">DONE</div>
        </div>

        {/* Item 2: THE UPDATED BLUE STATUS */}
        <div className="mockup-list-item active-item-blue">
          <div className="item-icon"><i className="fa-solid fa-microchip" style={{color: 'white'}}></i></div>
          <div className="item-text">
            <div className="skeleton-line short blue"></div>
            <div className="skeleton-line long"></div>
          </div>
          <div className="status-badge-blue">IN PROGRESS</div>
        </div>
        
        {/* New: Activity Feed Section */}
        <div className="activity-feed">
           <div className="feed-line"> > CALIBRATING ENGINE SENSORS...</div>
           <div className="feed-line"> > SYSTEM CHECK: OPTIMAL</div>
           <div className="feed-line active-line"> > UPDATING INVENTORY...</div>
        </div>
      </div>
    </div>
    
    {/* Floating Tag */}
<div className="floating-success-card">
  <i className="fa-solid fa-shield-halved" style={{color: '#3b82f6'}}></i>
  <span>System Secure</span>
</div>
  </div>

          </div>
        </div>
      </section>

      <section className="services-section">
        <div className="section-inner">
          <h2>{t("home.our_services")}</h2>
          <p className="section-subtitle">
            {t("home.services_subtitle")}
          </p>

          <div className="card-grid">

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-oil-can"></i>
              </div>
              <h3>{t("home.oil_change")}</h3>
              <p>
                {t("home.oil_change_desc")}
              </p>
            </article>

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-car-burst"></i>
              </div>
              <h3>{t("home.brakes")}</h3>
              <p>
                {t("home.brakes_desc")}
              </p>
            </article>

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-gauge-high"></i>
              </div>
              <h3>{t("home.engine")}</h3>
              <p>
                {t("home.engine_desc")}
              </p>
            </article>

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-car"></i>
              </div>
              <h3>{t("home.tires")}</h3>
              <p>
                {t("home.tires_desc")}
              </p>
            </article>

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-car-battery"></i>
              </div>
              <h3>{t("home.battery")}</h3>
              <p>
                {t("home.battery_desc")}
              </p>
            </article>

            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-fan"></i>
              </div>
              <h3>{t("home.ac")}</h3>
              <p>
                {t("home.ac_desc")}
              </p>
            </article>

          </div>
          <div className="section-cta">
            <button type="button" className="btn-primary"> {' '} <Link to="/services"> {t("home.view_all")} </Link>
            </button>
          </div>
        </div>
      </section>

      <PartnerCarousel />


      <div style={{ padding: '40px 0' }}>
      </div>
      <section className="why-section">
        <div className="section-inner">
          <h2>{t("home.why_choose_us")}</h2>
          <p className="section-subtitle">
            {t("home.why_subtitle")}
          </p>
          <div className="card-grid">
            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-screwdriver-wrench"></i>
              </div>
              <h3>{t("home.expert_mechanics")}</h3>
              <p>{t("home.expert_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-hourglass-end"></i>
              </div>
              <h3>{t("home.fast_turnaround")}</h3>
              <p>{t("home.fast_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3>{t("home.secure_warranty")}</h3>
              <p>{t("home.warranty_desc")}</p>
            </article>
            <article className="info-card">
              <div className="card-icon">
                <i className="fa-solid fa-dollar-sign"></i>
              </div>
              <h3>{t("home.affordable_pricing")}</h3>
              <p>{t("home.pricing_desc")}</p>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home