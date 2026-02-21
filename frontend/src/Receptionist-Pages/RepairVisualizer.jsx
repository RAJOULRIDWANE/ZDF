import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom'; // Added Link
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import DashboardNavbar from '../components/DashboardNavbar';
import './RepairVisualizer.css';

// --- 1. IMAGE CONFIGURATION ---
const CAR_IMAGES = {
  sedan: {
    front: "/car-views/front.png",
    back: "/car-views/back.png",
    left: "/car-views/side.png",
    right: "/car-views/side.png",
    top: "/car-views/top.png",
    bottom: "/car-views/bottom.png",
  }
};

// --- 2. COLORS ---
const STATUS_COLORS = {
  'Pending': 'rgba(255, 165, 0, 0.6)',
  'In Progress': 'rgba(0, 123, 255, 0.6)',
  'Completed': 'rgba(40, 167, 69, 0.6)',
  'Cancelled': 'rgba(220, 53, 69, 0.6)',
};

// --- 3. ZONE MAPPING ---
const ZONE_MAP = {
  sedan: {
    front: {
      LIGHTS: [
        { top: '48%', left: '10%', width: '12%', height: '10%', borderRadius: '50%' },
        { top: '48%', left: '78%', width: '12%', height: '10%', borderRadius: '50%' }
      ]
    },
    back: {
      LIGHTS: [
        { top: '42%', left: '12%', width: '15%', height: '12%', borderRadius: '10%' },
        { top: '42%', left: '73%', width: '15%', height: '12%', borderRadius: '10%' }
      ],
      EXHAUST: { top: '82%', left: '70%', width: '10%', height: '10%', borderRadius: '50%' }
    },
    right: {
      WHEELS: [
        { top: '56%', left: '14%', width: '17%', height: '24%', borderRadius: '50%' },
        { top: '56%', left: '69%', width: '17%', height: '24%', borderRadius: '50%' }
      ]
    },
    left: {
      WHEELS: [
        { top: '56%', left: '14%', width: '17%', height: '24%', borderRadius: '50%' },
        { top: '56%', left: '69%', width: '17%', height: '24%', borderRadius: '50%' }
      ]
    },
    top: {
      ENGINE: { top: '12%', left: '25%', width: '50%', height: '25%', borderRadius: '15%' },
      BODY: { top: '38%', left: '20%', width: '60%', height: '40%', borderRadius: '5px' }
    },
    bottom: {
      ENGINE: { top: '15%', left: '30%', width: '40%', height: '20%', borderRadius: '5px' },
      BODY: { top: '40%', left: '25%', width: '50%', height: '30%', borderRadius: '5px' },
      WHEELS: [
        { top: '22%', left: '8%', width: '12%', height: '15%', borderRadius: '10%' },
        { top: '22%', left: '80%', width: '12%', height: '15%', borderRadius: '10%' },
        { top: '72%', left: '8%', width: '12%', height: '15%', borderRadius: '10%' },
        { top: '72%', left: '80%', width: '12%', height: '15%', borderRadius: '10%' }
      ]
    }
  }
};

const RepairVisualizer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { repairId } = useParams();

  const [user] = useState({ name: localStorage.getItem('USER_NAME') || t('roles.receptionist'), role: 'Receptionist' });
  const [repairs, setRepairs] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [currentView, setCurrentView] = useState('front');

  useEffect(() => {
    fetchRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repairId]);

  const fetchRepairs = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get('http://127.0.0.1:8000/api/receptionist/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("FIRST REPAIR DATA:", JSON.stringify(res.data.repairs[0], null, 2));
      console.log("FULL API DATA:", res.data);

      const allRepairs = res.data.repairs || [];

      if (repairId) {
        const targetRepair = allRepairs.find(r => r.id.toString() === repairId.toString());
        if (targetRepair) {
          setRepairs([targetRepair]);
          setSelectedRepair(targetRepair);
        } else {
          setRepairs([]);
          setSelectedRepair(null);
        }
      } else {
        setRepairs(allRepairs);
        if (allRepairs.length > 0) setSelectedRepair(allRepairs[0]);
      }
    } catch (err) {
      console.error("Error loading repairs", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- 4. CATEGORY LOGIC (DB Driven) ---
  const getCategory = (repair) => {
    if (!repair || !repair.service || !repair.service.zone) return 'BODY';
    return repair.service.zone.toUpperCase();
  };

  const getImageStyle = () => {
    if (currentView === 'left') return { transform: 'scaleX(-1)' };
    return {};
  };

  const renderZone = () => {
    if (!selectedRepair) return null;
    const vehicleType = 'sedan';

    const category = getCategory(selectedRepair);
    if (!ZONE_MAP[vehicleType] || !ZONE_MAP[vehicleType][currentView]) return null;
    const coords = ZONE_MAP[vehicleType][currentView][category];
    if (!coords) return null;

    const statusKey = selectedRepair.status?.trim() || 'Pending';
    let finalColor = STATUS_COLORS['Pending'];
    if (statusKey.toLowerCase().includes('progress')) finalColor = STATUS_COLORS['In Progress'];
    else if (statusKey.toLowerCase() === 'completed') finalColor = STATUS_COLORS['Completed'];
    else if (statusKey.toLowerCase() === 'cancelled') finalColor = STATUS_COLORS['Cancelled'];

    const styleBase = {
      position: 'absolute',
      backgroundColor: finalColor,
      border: '2px solid white',
      boxShadow: '0 0 15px rgba(255,255,255,0.8)',
      zIndex: 10,
      cursor: 'pointer',
      animation: 'pulse 2s infinite'
    };

    const zonesToRender = Array.isArray(coords) ? coords : [coords];

    return zonesToRender.map((pos, index) => (
      <div
        key={index}
        className="visual-overlay-box"
        style={{
          ...styleBase,
          top: pos.top,
          left: pos.left,
          width: pos.width,
          height: pos.height,
          borderRadius: pos.borderRadius || '5px'
        }}
        title={`${category}: ${statusKey}`}
      >
        <span className="zone-label">{t(`mechanic.details.zones.${category.toLowerCase()}`)}</span>
      </div>
    ));
  };

  return (
    <div className="visualizer-page">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="visualizer-content">

        {/* --- LEFT SIDEBAR --- */}
        <div className="repair-sidebar">
          <div className="repair-sidebar-header">
            <h3>{repairId ? t('receptionist.visualizer.tracking_title') : t('receptionist.visualizer.active_jobs')}</h3>
          </div>

          <div className="repair-list">
            {repairs.map(repair => (
              <div
                key={repair.id}
                className={`repair-item ${selectedRepair?.id === repair.id ? 'active' : ''}`}
                onClick={() => setSelectedRepair(repair)}
              >
                <div className="repair-header">
                  <span className="vehicle-title">{repair.vehicle?.make} {repair.vehicle?.model}</span>
                  <span className={`badge ${repair.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {t(`common.status.${repair.status?.toLowerCase().replace(/\s+/g, '_')}`)}
                  </span>
                </div>

                <div className="repair-desc">
                  {repair.service?.name}
                </div>
                <span className="repair-sub-desc">
                  {repair.description ? (repair.description.length > 50 ? repair.description.substring(0, 50) + '...' : repair.description) : t('receptionist.visualizer.no_notes')}
                </span>
              </div>
            ))}
            {repairs.length === 0 && <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>{t('receptionist.visualizer.no_repairs')}</div>}
          </div>

          {repairId && selectedRepair && (
            <Link
              to={`/receptionist/client/${selectedRepair.vehicle?.client_id}/${selectedRepair.vehicle?.owner_name}`}
              className="back-link-container"
            >
              <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i>
              {t('receptionist.visualizer.back_to_client')}
            </Link>
          )}
        </div>

        {/* --- RIGHT STAGE --- */}
        <div className="visualizer-stage">
          {selectedRepair ? (
            <div className="car-card-wrapper">

              <div className="stage-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedRepair.vehicle?.plate_number}</h2>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{t('receptionist.visualizer.visualizing_status')}</span>
                </div>

                {/* MOVED: View Controls inside the header for cleaner look */}
                <div className="control-bar">
                  {['front', 'left', 'right', 'back', 'top', 'bottom'].map(view => (
                    <button
                      key={view}
                      className={`view-btn ${currentView === view ? 'active' : ''}`}
                      onClick={() => setCurrentView(view)}
                    >
                      {t(`receptionist.visualizer.views.${view}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="car-container">
                <img
                  src={CAR_IMAGES.sedan[currentView]}
                  alt={`${currentView} View`}
                  className="vehicle-image"
                  style={getImageStyle()}
                />
                {renderZone()}
              </div>

              <div className="legend">
                <div className="legend-item"><span className="dot pending" style={{ background: 'orange' }}></span> {t('receptionist.visualizer.legend.pending')}</div>
                <div className="legend-item"><span className="dot progress" style={{ background: '#0d6efd' }}></span> {t('receptionist.visualizer.legend.in_progress')}</div>
                <div className="legend-item"><span className="dot completed" style={{ background: '#28a745' }}></span> {t('receptionist.visualizer.legend.completed')}</div>
              </div>

            </div>
          ) : (
            <div className="empty-state">{t('receptionist.visualizer.select_repair')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepairVisualizer;
