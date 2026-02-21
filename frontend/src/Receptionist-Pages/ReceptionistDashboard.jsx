import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardNavbar from '../components/DashboardNavbar';
import "./ReceptionistDashboard.css";

const ReceptionistDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- User State ---
  const [user, setUser] = useState({
    name: localStorage.getItem('USER_NAME') || t('roles.receptionist'),
    role: localStorage.getItem('USER_ROLE') || t('roles.receptionist')
  });

  // --- Data State ---
  const [groupedClients, setGroupedClients] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);

  // --- Loading State ---
  const [loading, setLoading] = useState(true);

  // --- Filter State ---
  const [dashboardSearch, setDashboardSearch] = useState('');

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  // --- Add Job Form State ---
  const [searchQuery, setSearchQuery] = useState(''); // Client Search
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientVehicles, setClientVehicles] = useState([]);

  // --- SERVICE SEARCH & SELECTION STATE ---
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceList, setShowServiceList] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]); // Stores array of service objects

  const [formData, setFormData] = useState({
    vehicle_id: '',
    mechanic_id: '',
    description: '',
    cost: '', // Calculated automatically
    date_end: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/services');
      setServices(res.data);
    } catch (err) {
      console.error("Error fetching services", err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const clientRes = await axios.get('http://127.0.0.1:8000/api/receptionist/clients-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupedClients(clientRes.data);

      const dashRes = await axios.get('http://127.0.0.1:8000/api/receptionist/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (dashRes.data.user) {
        setUser(dashRes.data.user);
        localStorage.setItem('USER_NAME', dashRes.data.user.name);
        localStorage.setItem('USER_ROLE', dashRes.data.user.role);
      }

      setMechanics(dashRes.data.mechanics || []);
      setRepairs(dashRes.data.repairs || []);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleClientClick = (client) => {
    const safeName = client.name ? client.name.replace(/\s+/g, '-') : t('roles.client');
    navigate(`/receptionist/client/${client.id}/${safeName}`);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post('http://127.0.0.1:8000/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) { console.error("Logout failed", error); }
    localStorage.clear();
    navigate('/login');
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  // --- KPI Logic ---
  const getKPIData = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todaysAppointments = repairs.filter(r => r.date_end && r.date_end.startsWith(today)).length;
    const confirmedToday = repairs.filter(r => {
      if (!r.date_end || !r.status) return false;
      return r.date_end.startsWith(today) && r.status.toLowerCase().trim() === 'completed';
    }).length;
    return { todaysAppointments, confirmedToday };
  };

  const { todaysAppointments, confirmedToday } = getKPIData();

  const filteredClients = (() => {
    if (!dashboardSearch) return groupedClients;
    const lowerSearch = dashboardSearch.toLowerCase();
    return groupedClients.filter(client =>
      client.name.toLowerCase().includes(lowerSearch) ||
      client.email.toLowerCase().includes(lowerSearch)
    );
  })();

  // --- CLIENT SEARCH LOGIC ---
  const handleClientSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      try {
        const token = localStorage.getItem('ACCESS_TOKEN');
        const res = await axios.get(`http://127.0.0.1:8000/api/receptionist/clients/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    } else { setSearchResults([]); }
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
    setSearchResults([]);
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get(`http://127.0.0.1:8000/api/receptionist/clients/${client.id}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientVehicles(res.data);
    } catch (err) { showMessage(t('receptionist.modal.load_vehicles_error'), "error"); }
  };



  // --- SERVICE SEARCH & ADD LOGIC ---
  const filteredServices = services.filter(service => {
    if (!serviceSearch) return true;
    const searchLower = serviceSearch.toLowerCase();
    const nameMatch = service.name.toLowerCase().includes(searchLower);
    const zoneMatch = service.zone && service.zone.toLowerCase().includes(searchLower);
    return nameMatch || zoneMatch;
  });

  const calculateTotal = (servicesList) => {
    const total = servicesList.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    setFormData(prev => ({ ...prev, cost: total }));
  };

  const selectService = (service) => {
    // Prevent duplicates
    if (selectedServices.some(s => s.id === service.id)) {
      setServiceSearch('');
      setShowServiceList(false);
      return;
    }

    const updatedList = [...selectedServices, service];
    setSelectedServices(updatedList);
    calculateTotal(updatedList); // Update cost

    setServiceSearch('');
    setShowServiceList(false);
  };

  const removeService = (serviceId) => {
    const updatedList = selectedServices.filter(s => s.id !== serviceId);
    setSelectedServices(updatedList);
    calculateTotal(updatedList); // Update cost
  };

  // --- SPLIT DATE/TIME LOGIC ---
  // Helper to get parts safe
  const getDatePart = () => formData.date_end ? formData.date_end.split('T')[0] : '';
  const getTimePart = () => formData.date_end ? formData.date_end.split('T')[1] : '';

  const handleDatePartChange = (e) => {
    const newDate = e.target.value; // YYYY-MM-DD
    // If user clears date, clear everything
    if (!newDate) {
      setFormData({ ...formData, date_end: '' });
      return;
    }
    // If there was a time selected, keep it. If not, default to 08:00
    const currentTime = getTimePart() || '08:00';
    setFormData({ ...formData, date_end: `${newDate}T${currentTime}` });
  };

  const handleTimePartChange = (e) => {
    const newTime = e.target.value; // HH:mm
    const currentDate = getDatePart();

    // Only update if we have a date (though input is disabled if no date)
    if (currentDate && newTime) {
      setFormData({ ...formData, date_end: `${currentDate}T${newTime}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.vehicle_id || !formData.mechanic_id || !formData.date_end) {
      showMessage(t('receptionist.modal.fill_required'), "error"); return;
    }
    if (selectedServices.length === 0) {
      showMessage(t('receptionist.modal.select_service_error'), "error"); return;
    }

    try {
      const token = localStorage.getItem('ACCESS_TOKEN');

      // PREPARE PAYLOAD FOR BACKEND
      const payload = {
        ...formData,
        service_ids: selectedServices.map(s => s.id) // Send Array of IDs
      };

      const response = await axios.post('http://127.0.0.1:8000/api/receptionist/jobs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        // Reset Form & Services
        setFormData({ vehicle_id: '', mechanic_id: '', description: '', cost: '', date_end: '' });
        setSelectedServices([]);
        setSearchQuery('');
        setServiceSearch('');
        setSelectedClient(null);
        fetchDashboardData();
        showMessage(t('receptionist.modal.success'), "success");
      }
    } catch (err) {
      console.error("Error:", err);
      showMessage(t('receptionist.modal.error'), "error");
    }
  };

  return (
    <div className="receptionist-container">
      <DashboardNavbar
        user={user}
        onLogout={handleLogout}
        onChangePassword={() => setShowPasswordModal(true)}
      />

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fa-regular fa-calendar"></i></div>
          <div className="kpi-info"><h3>{t('receptionist.today_appointments')}</h3><p className="kpi-number">{todaysAppointments}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success-icon"><i className="fa-regular fa-circle-check"></i></div>
          <div className="kpi-info"><h3>{t('receptionist.confirmed_appointments')}</h3><p className="kpi-number">{confirmedToday}</p></div>
        </div>
      </div>

      <div className="header-actions">
        <h1>{t('receptionist.title')}</h1>
        <button className="add-btn" onClick={() => setShowModal(true)}>{t('receptionist.add_appointment')}</button>
      </div>

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder={t('receptionist.search_placeholder')}
          className="dashboard-search-input"
          value={dashboardSearch}
          onChange={(e) => setDashboardSearch(e.target.value)}
        />
      </div>
      {!showModal && message && (
        <div className={`alert-message ${messageType}`}><span>{message}</span></div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr><th>{t('receptionist.client_name')}</th><th>{t('receptionist.total_vehicles')}</th><th>{t('receptionist.repairs_history')}</th><th>{t('receptionist.action')}</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px", color: "#005DFFFF", marginBottom: "10px" }}></i>
                  <p>{t('receptionist.loading_clients')}</p>
                </td>
              </tr>
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <tr key={client.id} className="clickable-row" onClick={() => handleClientClick(client)}>
                  <td><strong>{client.name}</strong><div className="sub-text">{client.email}</div></td>
                  <td>{t('receptionist.vehicles_count', { count: client.vehicles?.length || 0 })}</td>
                  <td><span className="status-badge progress">{t('receptionist.repairs_count', { count: client.repairs_count })}</span></td>
                  <td><button className="action-btn view-btn"><i className="fa-solid fa-eye"></i> {t('receptionist.view_history')}</button></td>
                </tr>
              ))) : (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>{t('receptionist.no_clients')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t('receptionist.modal.title')}</h2>
            {message && <div className={`alert-message ${messageType}`}>{message}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('receptionist.modal.customer')} :</label>
                <input type="text" className="form-control" placeholder={t('receptionist.modal.customer_placeholder')} value={searchQuery} onChange={handleClientSearch} />
                {searchResults.length > 0 && (
                  <ul className="suggestions-list">
                    {searchResults.map(c => <li key={c.id} onClick={() => selectClient(c)}>{c.name}</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.vehicle')} :</label>
                <select className="form-control" value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} disabled={!selectedClient}>
                  <option value="">{t('receptionist.modal.select_vehicle')}</option>
                  {clientVehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
                </select>
              </div>

              {/* --- SELECTED SERVICES LIST (TAGS) --- */}
              {selectedServices.length > 0 && (
                <div className="selected-services-container" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>{t('receptionist.modal.selected_services')}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedServices.map(s => (
                      <span key={s.id} style={{
                        background: '#e3f2fd', color: '#005DFFFF',
                        padding: '6px 10px', borderRadius: '15px', fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #b3d7ff'
                      }}>
                        {s.name} - {s.zone} ({s.price} MAD)
                        <i className="fa-solid fa-xmark"
                          style={{ cursor: 'pointer', color: '#ff4d4d' }}
                          onClick={() => removeService(s.id)}>
                        </i>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* --- SEARCH TO ADD SERVICE --- */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label>{t('receptionist.modal.add_service')} :</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('receptionist.modal.service_placeholder')}
                  value={serviceSearch}
                  onChange={(e) => {
                    setServiceSearch(e.target.value);
                    setShowServiceList(true);
                  }}
                  onFocus={() => setShowServiceList(true)}
                  onBlur={() => setTimeout(() => setShowServiceList(false), 200)}
                />

                {showServiceList && (
                  <ul className="suggestions-list service-list">
                    {filteredServices.length > 0 ? filteredServices.map(s => (
                      <li key={s.id} onMouseDown={() => selectService(s)}>
                        <div className="service-row">
                          <span className="service-name">{s.name}</span>
                          <span className="service-zone">{s.zone || t('mechanic.details.zones.all')}</span>
                        </div>
                        <span className="service-price">{s.price} MAD</span>
                      </li>
                    )) : (
                      <li className="no-result">{t('receptionist.modal.no_services')}</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.total_cost')} :</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.cost}
                  readOnly
                  style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}
                />
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.notes')} :</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('receptionist.modal.notes_placeholder')}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('receptionist.modal.mechanic')} :</label>
                <select className="form-control" value={formData.mechanic_id} onChange={e => setFormData({ ...formData, mechanic_id: e.target.value })}>
                  <option value="">{t('receptionist.modal.select_mechanic')}</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {/* --- DATE & TIME SPLIT INPUTS --- */}
              <div className="form-group">
                <label>{t('receptionist.modal.end_date_time')} :</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* DATE INPUT */}
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="form-control"
                    value={getDatePart()}
                    onChange={handleDatePartChange}
                    required
                  />

                  {/* TIME INPUT (With Min/Max Limits) */}
                  <input
                    type="time"
                    className="form-control"
                    value={getTimePart()}
                    onChange={handleTimePartChange}
                    min="08:00"
                    max="20:30"
                    required
                    disabled={!getDatePart()} // Disable time until date is picked
                  />
                </div>
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  {t('receptionist.modal.working_hours')}
                </small>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">{t('receptionist.modal.save')}</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>{t('receptionist.modal.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
