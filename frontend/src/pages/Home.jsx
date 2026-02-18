import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Home.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

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