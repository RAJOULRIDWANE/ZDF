import { useState } from 'react';
import UserManagement from '../components/UserManagement';
import DashboardNavbar from '../components/DashboardNavbar';
import SupervisorSidebar from '../components/SupervisorSidebar';
import "./SupervisorDashboard.css";

/* ── Placeholder visualizations for sidebar sections ── */
const SectionPlaceholder = ({ icon, title, description, badge }) => (
  <div className="section-placeholder">
    <div className="placeholder-icon">
      <i className={icon}></i>
    </div>
    <h2 className="placeholder-title">{title}</h2>
    {badge && <span className="placeholder-badge">{badge}</span>}
    <p className="placeholder-desc">{description}</p>
  </div>
);

const AnalyticsSection = ({ chiffredaffaire }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-bar-chart-2-line"></i> Analytics &amp; Reports</h1>
      <p className="section-subtitle">Interactive Metabase analytics dashboard for full operational oversight.</p>
    </div>
    <div className="analytics-container">
      {chiffredaffaire ? (
        <iframe
          src={chiffredaffaire}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>Your Metabase dashboard URL is not configured yet.<br /></p>
        </div>
      )}
    </div>
  </div>
);


const PartsSection = ({ topparts }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-tools-line"></i> Parts Management</h1>
      <p className="section-subtitle">Overview of parts inventory, usage, and low-stock alerts.</p>
    </div>
    <div className="analytics-container">
      {topparts ? (
        <iframe
          src={topparts}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>Your Metabase dashboard URL is not configured yet.<br /></p>
        </div>
      )}
    </div>
  </div>
);

const AppointmentsSection = ({ appointments }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-calendar-check-line"></i> Appointments</h1>
      <p className="section-subtitle">Monitor scheduled appointments and daily workload distribution.</p>
    </div>
    <div className="analytics-container">
      {appointments ? (
        <iframe
          src={appointments}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>Your Metabase dashboard URL is not configured yet.<br /></p>
        </div>
      )}
    </div>
  </div>
);


const TopClientSection = ({ topclients }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-car-line"></i> Repairs</h1>
      <p className="section-subtitle">Live repair pipeline status across all mechanics.</p>
    </div>
    <div className="analytics-container">
      {topclients ? (
        <iframe
          src={topclients}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>Your Metabase dashboard URL is not configured yet.<br /></p>
        </div>
      )}
    </div>
  </div>
);

const TopServicesSection = ({ topservices }) => (
  <div className="supervisor-section">
    <div className="section-header">
      <h1><i className="ri-file-chart-line"></i> Reports</h1>
      <p className="section-subtitle">Generate and view performance, financial, and operational reports.</p>
    </div>
    <div className="analytics-container">
      {topservices ? (
        <iframe
          src={topservices}
          frameBorder="0"
          width="100%"
          height="800"
          allowTransparency="true"
          title="Metabase Analytics"
        />
      ) : (
        <div className="metabase-placeholder">
          <p>Your Metabase dashboard URL is not configured yet.<br /></p>
        </div>
      )}
    </div>
  </div>
);



/* ── Main Dashboard Component ── */
const SupervisorDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');

  const user = {
    name: localStorage.getItem('name') || 'Supervisor',
    role: localStorage.getItem('USER_ROLE') || 'supervisor',
  };

  const chiffredaffaire = "http://localhost:3000/public/dashboard/5ebdbcbd-6511-4114-a95b-9c36580188b7#theme=night&background=false&bordered=false";
  const appointments = "http://localhost:3000/public/dashboard/b29fcdbd-0395-4012-a450-3582e4e96174#theme=night&background=false&bordered=false";
  const topclients = "http://localhost:3000/public/dashboard/dcfafa27-a88d-4564-a34e-380fa7d42cf5#theme=night&background=false&bordered=false";
  const topservices = "http://localhost:3000/public/dashboard/0baf9b88-8e53-44c3-bbad-68a429a6a338#theme=night&background=false&bordered=false";
  const topparts = "http://localhost:3000/public/dashboard/ee6a6ad0-94b9-484a-97dd-669dffd9348d#theme=night&background=false&bordered=false";


  const renderSection = () => {
    switch (activeSection) {
      case 'analytics': return <AnalyticsSection chiffredaffaire={chiffredaffaire} />;
      case 'user-management': return <UserManagement />;
      case 'parts': return <PartsSection topparts={topparts} />;
      case 'appointments': return <AppointmentsSection appointments={appointments} />;
      case 'repairs': return <TopClientSection topclients={topclients} />;
      case 'reports': return <TopServicesSection topservices={topservices} />;
      default: return null;
    }
  };

  return (
    <div className="supervisor-dashboard-container">
      <DashboardNavbar user={user} />

      <div className="supervisor-app-body">
        {/* ── Left Sidebar ── */}
        <SupervisorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* ── Main Content ── */}
        <main className="supervisor-main">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
