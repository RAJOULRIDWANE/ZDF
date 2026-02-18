import { Link } from "react-router-dom";
import MECHANIC from "/images/MECHANIC.png";
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-mark">
              <img src={MECHANIC} alt="MecaPro logo" className="logo" />
            </div>
            <span className="footer-logo-text">MecaPro</span>
          </div>
          <div className="footer-columns">

            <div className="footer-column Services">
              <h4>Services</h4>
              <div className="Services1">
                <div>
                  <Link to="/services#maintenance" className="link"> Maintenance </Link>
                  <Link to="/services#brakes" className="link"> Brakes, Tires & Suspension </Link>
                  <Link to="/services#engine" className="link"> Engine & Transmission </Link>
                </div>
                <div>
                  <Link to="/services#electrical" className="link"> Electrical & Fuel Systems </Link>
                  <Link to="/services#cooling" className="link"> Cooling, Exhaust & Climate </Link>
                  <Link to="/services#inspection" className="link"> Inspection & Detailing </Link>
                </div>
              </div>
            </div>
            <div className="footer-column Company">
              <h4>Company</h4>
              <Link to="/about" className="link"> About </Link>
            </div>
            <div className="footer-column Support">
              <h4>Support</h4>
              <Link to="/contact" className="link"> Contact </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 All Rights Reserved to Auto Repair</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
