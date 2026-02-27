import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import "./ReceptionistDashboard.css";

const ReceptionistDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: localStorage.getItem('USER_NAME') || 'Receptionist',
    role: localStorage.getItem('USER_ROLE') || 'Receptionist'
  });

  const [groupedClients, setGroupedClients] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientVehicles, setClientVehicles] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceList, setShowServiceList] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({ vehicle_id: '', mechanic_id: '', description: '', cost: '', date_end: '' });
  const [apptActionLoading, setApptActionLoading] = useState(null);
  const [apptNotes, setApptNotes] = useState({});

  useEffect(() => {
    fetchDashboardData();
    fetchServices();
    fetchAppointments();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/services');
      setServices(res.data);
    } catch (err) { console.error("Error fetching services", err); }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const res = await axios.get('http://127.0.0.1:8000/api/receptionist/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data || []);
    } catch (err) { console.error('Error fetching appointments', err); }
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
    const safeName = client.name ? client.name.replace(/\s+/g, '-') : 'Client';
    navigate(`/receptionist/client/${client.id}/${safeName}`);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post('http://127.0.0.1:8000/api/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error("Logout failed", error); }
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  const handleApptApprove = async (id) => {
    setApptActionLoading(id + '-approve');
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post(`http://127.0.0.1:8000/api/receptionist/appointments/${id}/approve`,
        { notes: apptNotes[id] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('Appointment approved.', 'success');
      fetchAppointments();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to approve.', 'error');
    } finally { setApptActionLoading(null); }
  };

  const handleApptDecline = async (id) => {
    setApptActionLoading(id + '-decline');
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      await axios.post(`http://127.0.0.1:8000/api/receptionist/appointments/${id}/decline`,
        { notes: apptNotes[id] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMessage('Appointment declined.', 'success');
      fetchAppointments();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to decline.', 'error');
    } finally { setApptActionLoading(null); }
  };

  const getKPIData = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = repairs.filter(r => r.date_end && r.date_end.startsWith(today)).length;
    const confirmedToday = repairs.filter(r => r.date_end?.startsWith(today) && r.status?.toLowerCase().trim() === 'completed').length;
    return { todaysAppointments, confirmedToday };
  };

  const { todaysAppointments, confirmedToday } = getKPIData();
  const pendingAppts = appointments.filter(a => a.status === 'Pending').length;

  const filteredClients = (() => {
    if (!dashboardSearch) return groupedClients;
    const lowerSearch = dashboardSearch.toLowerCase();
    return groupedClients.filter(client =>
      client.name.toLowerCase().includes(lowerSearch) ||
      client.email.toLowerCase().includes(lowerSearch)
    );
  })();

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
    } catch (err) { showMessage("Could not load vehicles", "error"); }
  };

  const filteredServices = services.filter(service => {
    if (!serviceSearch) return true;
    const searchLower = serviceSearch.toLowerCase();
    return service.name.toLowerCase().includes(searchLower) || (service.zone && service.zone.toLowerCase().includes(searchLower));
  });

  const calculateTotal = (servicesList) => {
    const total = servicesList.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
    setFormData(prev => ({ ...prev, cost: total }));
  };

  const selectService = (service) => {
    if (selectedServices.some(s => s.id === service.id)) { setServiceSearch(''); setShowServiceList(false); return; }
    const updatedList = [...selectedServices, service];
    setSelectedServices(updatedList);
    calculateTotal(updatedList);
    setServiceSearch('');
    setShowServiceList(false);
  };

  const removeService = (serviceId) => {
    const updatedList = selectedServices.filter(s => s.id !== serviceId);
    setSelectedServices(updatedList);
    calculateTotal(updatedList);
  };

  const getDatePart = () => formData.date_end ? formData.date_end.split('T')[0] : '';
  const getTimePart = () => formData.date_end ? formData.date_end.split('T')[1] : '';

  const handleDatePartChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) { setFormData({ ...formData, date_end: '' }); return; }
    const currentTime = getTimePart() || '08:00';
    setFormData({ ...formData, date_end: `${newDate}T${currentTime}` });
  };

  const handleTimePartChange = (e) => {
    const newTime = e.target.value;
    const currentDate = getDatePart();
    if (currentDate && newTime) setFormData({ ...formData, date_end: `${currentDate}T${newTime}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.mechanic_id || !formData.date_end) {
      showMessage("Please fill in required fields.", "error"); return;
    }
    if (formData.description.trim().length > 0 && formData.description.trim().length < 5) {
      showMessage("Notes must be at least 5 characters long.", "error"); return;
    } if (selectedServices.length === 0) {
      showMessage("Please select at least one service.", "error"); return;
    }
    try {
      const token = localStorage.getItem('ACCESS_TOKEN');
      const payload = { ...formData, service_ids: selectedServices.map(s => s.id) };
      const response = await axios.post('http://127.0.0.1:8000/api/receptionist/jobs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200 || response.status === 201) {
        setShowModal(false);
        setFormData({ vehicle_id: '', mechanic_id: '', description: '', cost: '', date_end: '' });
        setSelectedServices([]);
        setSearchQuery('');
        setServiceSearch('');
        setSelectedClient(null);
        fetchDashboardData();
        showMessage("Appointment Created Successfully!", "success");
      }
    } catch (err) {
      console.error("Error:", err);
      showMessage("Error creating appointment.", "error");
    }
  };

  const apptStatusBadge = (status) => {
    const cls = { Pending: 'appt-badge-pending', Approved: 'appt-badge-approved', Declined: 'appt-badge-declined' };
    return <span className={`appt-badge-r ${cls[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="receptionist-container">
      <DashboardNavbar user={user} onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} />

      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-icon"><i className="fa-regular fa-calendar"></i></div>
          <div className="kpi-info"><h3>Today's Repairs</h3><p className="kpi-number">{todaysAppointments}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success-icon"><i className="fa-regular fa-circle-check"></i></div>
          <div className="kpi-info"><h3>Confirmed Today</h3><p className="kpi-number">{confirmedToday}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fffbeb' }}><i className="fa-solid fa-calendar-days" style={{ color: '#d97706' }}></i></div>
          <div className="kpi-info"><h3>Pending Appt. Requests</h3><p className="kpi-number">{pendingAppts}</p></div>
        </div>
      </div>

      <div className="header-actions">
        <h1>Dashboard</h1>
        <button className="add-btn" onClick={() => setShowModal(true)}>+ Add New Repair Job</button>
      </div>

      {/* Tabs */}
      <div className="r-tabs">
        <button className={`r-tab ${activeTab === 'clients' ? 'r-tab-active' : ''}`} onClick={() => setActiveTab('clients')}>
          <i className="fa-solid fa-users"></i> Clients Overview
        </button>
        <button className={`r-tab ${activeTab === 'appointments' ? 'r-tab-active' : ''}`} onClick={() => setActiveTab('appointments')}>
          <i className="fa-solid fa-calendar-check"></i> Appointment Requests
          {pendingAppts > 0 && <span className="r-tab-badge">{pendingAppts}</span>}
        </button>
      </div>

      {!showModal && message && (
        <div className={`alert-message ${messageType}`}><span>{message}</span></div>
      )}

      {activeTab === 'clients' ? (
        <>
          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Search Client by Name or Email..."
              className="dashboard-search-input"
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
            />
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr><th>Client Name</th><th>Total Vehicles</th><th>Total Repairs History</th><th>Action</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: 0 }}>
                      <SkeletonLoader type="table-rows" cols={4} count={5} />
                    </td>
                  </tr>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map(client => {
                    const clientPendingNegs = repairs.filter(r => r.vehicle?.client_id === client.id && r.status?.toLowerCase().trim() === 'negotiation requested').length;
                    return (
                      <tr key={client.id} className="clickable-row" onClick={() => handleClientClick(client)}>
                        <td><strong>{client.name}</strong><div className="sub-text">{client.email}</div></td>
                        <td>{client.vehicles?.length || 0} Vehicles</td>
                        <td><span className="status-badge progress">{client.repairs_count} Repairs</span></td>
                        <td>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button className="action-btn view-btn"><i className="fa-solid fa-eye"></i> View History</button>
                            {clientPendingNegs > 0 && (
                              <span className="r-tab-badge" style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}>
                                {clientPendingNegs}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })) : (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No clients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Vehicle</th>
                <th>Preferred Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Notes / Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No appointment requests yet.</td></tr>
              ) : appointments.map(appt => (
                <tr key={appt.id}>
                  <td><strong>{appt.client?.name}</strong><div className="sub-text">{appt.client?.email}</div></td>
                  <td>{appt.vehicle ? `${appt.vehicle.make} ${appt.vehicle.model}` : '—'}</td>
                  <td>{new Date(appt.preferred_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td style={{ maxWidth: '180px', fontSize: '0.85rem', color: '#6b7280' }}>{appt.description || '—'}</td>
                  <td>{apptStatusBadge(appt.status)}</td>
                  <td>
                    {appt.status === 'Pending' ? (
                      <div className="appt-action-col">
                        <input
                          type="text"
                          className="appt-notes-input"
                          placeholder="Optional notes..."
                          value={apptNotes[appt.id] || ''}
                          onChange={(e) => setApptNotes(prev => ({ ...prev, [appt.id]: e.target.value }))}
                        />
                        <div className="appt-action-row">
                          <button className="appt-btn-approve" disabled={apptActionLoading === appt.id + '-approve'} onClick={() => handleApptApprove(appt.id)}>
                            {apptActionLoading === appt.id + '-approve' ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> Approve</>}
                          </button>
                          <button className="appt-btn-decline" disabled={apptActionLoading === appt.id + '-decline'} onClick={() => handleApptDecline(appt.id)}>
                            {apptActionLoading === appt.id + '-decline' ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-xmark"></i> Decline</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>{appt.receptionist_notes || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Appointment</h2>
            {message && <div className={`alert-message ${messageType}`}>{message}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer :</label>
                <input type="text" className="form-control" placeholder="Search Client..." value={searchQuery} onChange={handleClientSearch} />
                {searchResults.length > 0 && (
                  <ul className="suggestions-list">
                    {searchResults.map(c => <li key={c.id} onClick={() => selectClient(c)}>{c.name}</li>)}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>Vehicle :</label>
                <select className="form-control" value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} disabled={!selectedClient}>
                  <option value="">-- Select Vehicle --</option>
                  {clientVehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model}</option>)}
                </select>
              </div>

              {selectedServices.length > 0 && (
                <div className="selected-services-container" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Selected Services:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedServices.map(s => (
                      <span key={s.id} style={{ background: '#e3f2fd', color: '#005DFFFF', padding: '6px 10px', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #b3d7ff' }}>
                        {s.name} - {s.zone} ({s.price} MAD)
                        <i className="fa-solid fa-xmark" style={{ cursor: 'pointer', color: '#ff4d4d' }} onClick={() => removeService(s.id)}></i>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Add Service :</label>
                <input
                  type="text" className="form-control" placeholder="Type to search and add services..."
                  value={serviceSearch}
                  onChange={(e) => { setServiceSearch(e.target.value); setShowServiceList(true); }}
                  onFocus={() => setShowServiceList(true)}
                  onBlur={() => setTimeout(() => setShowServiceList(false), 200)}
                />
                {showServiceList && (
                  <ul className="suggestions-list service-list">
                    {filteredServices.length > 0 ? filteredServices.map(s => (
                      <li key={s.id} onMouseDown={() => selectService(s)}>
                        <div className="service-row"><span className="service-name">{s.name}</span><span className="service-zone">{s.zone || 'General'}</span></div>
                        <span className="service-price">{s.price} MAD</span>
                      </li>
                    )) : <li className="no-result">No services found</li>}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>Total Cost (Auto-calculated) :</label>
                <input type="number" className="form-control" value={formData.cost} readOnly />
              </div>

              <div className="form-group">
                <label>Notes (Optional) :</label>
                <input type="text" className="form-control" placeholder="E.g. Customer hears noise..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Mechanic :</label>
                <select className="form-control" value={formData.mechanic_id} onChange={e => setFormData({ ...formData, mechanic_id: e.target.value })}>
                  <option value="">-- Select Mechanic --</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>End Date &amp; Time :</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" min={new Date().toISOString().split('T')[0]} className="form-control" value={getDatePart()} onChange={handleDatePartChange} required />
                  <input type="time" className="form-control" value={getTimePart()} onChange={handleTimePartChange} min="08:00" max="20:30" required disabled={!getDatePart()} />
                </div>
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Working hours: 08:00 AM to 08:30 PM</small>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;