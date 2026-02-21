import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import './Services.css';

function Services() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const categories = [
    {
      name: t('services.categories.maintenance.name'),
      id: "maintenance",
      services: [
        { icon: "fa-oil-can", title: t('services.categories.maintenance.oil_change'), description: t('services.categories.maintenance.oil_change_desc') },
        { icon: "fa-car-battery", title: t('services.categories.maintenance.battery'), description: t('services.categories.maintenance.battery_desc') },
        { icon: "fa-leaf", title: t('services.categories.maintenance.emissions'), description: t('services.categories.maintenance.emissions_desc') }
      ]
    },
    {
      name: t('services.categories.brakes.name'),
      id: "brakes",
      services: [
        { icon: "fa-circle-stop", title: t('services.categories.brakes.pads'), description: t('services.categories.brakes.pads_desc') },
        { icon: "fa-dharmachakra", title: t('services.categories.brakes.tires'), description: t('services.categories.brakes.tires_desc') },
        { icon: "fa-road", title: t('services.categories.brakes.suspension'), description: t('services.categories.brakes.suspension_desc') },
        { icon: "fa-dharmachakra", title: t('services.categories.brakes.alignment'), description: t('services.categories.brakes.alignment_desc') }
      ]
    },
    {
      name: t('services.categories.engine.name'),
      id: "engine",
      services: [
        { icon: "fa-microchip", title: t('services.categories.engine.diagnostics'), description: t('services.categories.engine.diagnostics_desc') },
        { icon: "fa-gears", title: t('services.categories.engine.transmission'), description: t('services.categories.engine.transmission_desc') },
        { icon: "fa-gears", title: t('services.categories.engine.clutch'), description: t('services.categories.engine.clutch_desc') }
      ]
    },
    {
      name: t('services.categories.electrical.name'),
      id: "electrical",
      services: [
        { icon: "fa-bolt", title: t('services.categories.electrical.diagnostics'), description: t('services.categories.electrical.diagnostics_desc') },
        { icon: "fa-plug-circle-bolt", title: t('services.categories.electrical.repair'), description: t('services.categories.electrical.repair_desc') },
        { icon: "fa-gas-pump", title: t('services.categories.electrical.fuel'), description: t('services.categories.electrical.fuel_desc') }
      ]
    },
    {
      name: t('services.categories.cooling.name'),
      id: "cooling",
      services: [
        { icon: "fa-temperature-half", title: t('services.categories.cooling.radiator'), description: t('services.categories.cooling.radiator_desc') },
        { icon: "fa-wind", title: t('services.categories.cooling.exhaust'), description: t('services.categories.cooling.exhaust_desc') },
        { icon: "fa-fan", title: t('services.categories.cooling.ac'), description: t('services.categories.cooling.ac_desc') }
      ]
    },
    {
      name: t('services.categories.inspection.name'),
      id: "inspection",
      services: [
        { icon: "fa-shield", title: t('services.categories.inspection.safety'), description: t('services.categories.inspection.safety_desc') },
        { icon: "fa-screwdriver-wrench", title: t('services.categories.inspection.detailing'), description: t('services.categories.inspection.detailing_desc') }
      ]
    }
  ];

  return (
    <div className="services-page">

      <div className="services-hero">
        <div className="services-hero-content">
          <h1>{t('services.title')}</h1>
          <p>{t('services.subtitle')}</p>
        </div>
      </div>

      <div className="services-container">

        {categories.map((category, index) => (
          <div key={index} className="service-category" id={category.id}>

            <h2 className="category-title">{category.name}</h2>

            <div className="services-grid">
              {category.services.map((service, i) => (
                <div key={i} className="service-card">

                  <i className={`fa-solid ${service.icon} service-icon`}></i>

                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>

                </div>
              ))}
            </div>

          </div>
        ))}

      </div>

      <div className="services-footer">
        <Link to="/contact" className="support-badge">
          <i className="fa-solid fa-shield-halved"></i>
          <span> {t('services.support')} </span>
        </Link>
      </div>

    </div>
  );
}

export default Services;
