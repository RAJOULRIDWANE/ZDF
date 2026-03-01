import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import './PartsManagerDashboard.css';

const BASE = 'http://127.0.0.1:8000/api';

const EMPTY_PART = { name: '', zone: '', category: '', cost: '', price: '', stock_quantity: '', reference_number: '' };
const EMPTY_SERVICE = { name: '', zone: '', price: '' };

const PartsManagerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: localStorage.getItem('USER_NAME') || 'Parts Manager',
    role: localStorage.getItem('USER_ROLE') || 'parts_manager'
  });

  // --- Data ---
  const [parts, setParts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kpis, setKpis] = useState({ total_parts: 0, pending_count: 0, low_stock_count: 0 });

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'requests'
  const [search, setSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [declineModal, setDeclineModal] = useState({ show: false, id: null, notes: '' });

  // --- Add Part Modal ---
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partForm, setPartForm] = useState(EMPTY_PART);
  const [partFormErrors, setPartFormErrors] = useState({});
  const [submittingPart, setSubmittingPart] = useState(false);

  // --- Add Service Modal ---
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [serviceFormErrors, setServiceFormErrors] = useState({});
  const [submittingService, setSubmittingService] = useState(false);

  const token = localStorage.getItem('ACCESS_TOKEN');
  const headers = { Authorization: `Bearer ${token}` };

  const showMsg = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, reqRes, userRes] = await Promise.all([
        axios.get(`${BASE}/parts-manager/dashboard`, { headers }),
        axios.get(`${BASE}/parts-manager/requests`, { headers }),
        axios.get(`${BASE}/user`, { headers }),
      ]);
      setParts(dashRes.data.parts || []);
      setKpis({
        total_parts: dashRes.data.total_parts,
        pending_count: dashRes.data.pending_count,
        low_stock_count: dashRes.data.low_stock_count,
      });
      setRequests(reqRes.data || []);

      const userData = {
        name: userRes.data.name || userRes.data.user?.name,
        role: userRes.data.role || userRes.data.user?.role
      };
      setUser(userData);
      localStorage.setItem('USER_NAME', userData.name);
      localStorage.setItem('USER_ROLE', userData.role);

    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('ACCESS_TOKEN'); localStorage.removeItem('USER_NAME'); localStorage.removeItem('USER_ROLE'); navigate('/login'); }
      showMsg('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await axios.post(`${BASE}/parts-manager/requests/${id}/approve`, {}, { headers });
      showMsg(res.data.message || 'Approved!', 'success');
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to approve.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    const { id, notes } = declineModal;
    setActionLoading(id);
    try {
      const res = await axios.post(`${BASE}/parts-manager/requests/${id}/decline`, { notes }, { headers });
      showMsg(res.data.message || 'Declined.', 'success');
      setDeclineModal({ show: false, id: null, notes: '' });
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to decline.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try { await axios.post(`${BASE}/logout`, {}, { headers }); } catch { }
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('USER_NAME');
    localStorage.removeItem('USER_ROLE');
    navigate('/login');
  };

  // ─── ADD PART ────────────────────────────────────────────────────────
  const openAddPart = () => { setPartForm(EMPTY_PART); setPartFormErrors({}); setShowAddPartModal(true); };
  const closeAddPart = () => { setShowAddPartModal(false); };

  const handlePartChange = (e) => {
    const { name, value } = e.target;
    setPartForm(prev => ({ ...prev, [name]: value }));
    setPartFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validatePart = () => {
    const errs = {};
    if (!partForm.name.trim()) errs.name = t('parts_manager.err_name_req', 'Name is required');
    if (!partForm.zone.trim()) errs.zone = t('parts_manager.err_zone_req', 'Zone is required');
    if (!partForm.category.trim()) errs.category = t('parts_manager.err_category_req', 'Category is required');
    if (partForm.cost === '' || isNaN(Number(partForm.cost))) errs.cost = t('parts_manager.err_cost_req', 'Valid cost required');
    if (partForm.price === '' || isNaN(Number(partForm.price))) errs.price = t('parts_manager.err_price_req', 'Valid price required');
    if (partForm.stock_quantity === '' || isNaN(Number(partForm.stock_quantity))) errs.stock_quantity = t('parts_manager.err_stock_req', 'Valid stock quantity required');
    return errs;
  };

  const handleSubmitPart = async (e) => {
    e.preventDefault();
    const errs = validatePart();
    if (Object.keys(errs).length > 0) { setPartFormErrors(errs); return; }
    setSubmittingPart(true);
    try {
      const res = await axios.post(`${BASE}/parts-manager/parts`, partForm, { headers });
      showMsg(res.data.message || 'Part added!', 'success');
      closeAddPart();
      fetchData();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) setPartFormErrors(serverErrors);
      else showMsg(err.response?.data?.message || 'Failed to add part.', 'error');
    } finally {
      setSubmittingPart(false);
    }
  };

  // ─── ADD SERVICE ─────────────────────────────────────────────────────
  const openAddService = () => { setServiceForm(EMPTY_SERVICE); setServiceFormErrors({}); setShowAddServiceModal(true); };
  const closeAddService = () => { setShowAddServiceModal(false); };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setServiceForm(prev => ({ ...prev, [name]: value }));
    setServiceFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateService = () => {
    const errs = {};
    if (!serviceForm.name.trim()) errs.name = t('parts_manager.err_name_req', 'Name is required');
    if (!serviceForm.zone.trim()) errs.zone = t('parts_manager.err_zone_req', 'Zone is required');
    if (serviceForm.price === '' || isNaN(Number(serviceForm.price))) errs.price = t('parts_manager.err_price_req', 'Valid price required');
    return errs;
  };

  const handleSubmitService = async (e) => {
    e.preventDefault();
    const errs = validateService();
    if (Object.keys(errs).length > 0) { setServiceFormErrors(errs); return; }
    setSubmittingService(true);
    try {
      const res = await axios.post(`${BASE}/parts-manager/services`, serviceForm, { headers });
      showMsg(res.data.message || 'Service added!', 'success');
      closeAddService();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) setServiceFormErrors(serverErrors);
      else showMsg(err.response?.data?.message || 'Failed to add service.', 'error');
    } finally {
      setSubmittingService(false);
    }
  };

  // ─── Filters ─────────────────────────────────────────────────────────
  const filteredParts = parts.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.zone?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
    (search === 'LOW_STOCK' && p.stock_quantity <= 30)
  );

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const pendingCount = pendingRequests.length;

  const filteredRequests = requests.filter(r =>
    !requestSearch || (requestSearch === 'PENDING' ? r.status === 'Pending' : true)
  );

  const statusBadge = (status) => {
    const map = { Pending: 'badge-pending', Approved: 'badge-approved', Declined: 'badge-declined' };
    return <span className={`pm-badge ${map[status] || ''}`}>{status}</span>;
  };

  // ─── Reusable input field component ──────────────────────────────────
  const Field = ({ label, name, type = 'text', value, onChange, errors, placeholder = '', required = true, step }) => (
    <div className="pm-form-group">
      <label className="pm-form-label">{label}{required && <span className="pm-required">*</span>}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        className={`pm-form-input ${errors[name] ? 'pm-input-error' : ''}`}
      />
      {errors[name] && <span className="pm-field-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="pm-container">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="pm-main">
        {/* Header */}
        <div className="pm-header">
          <div>
            <h1>{t('parts_manager.title', 'Parts Manager Dashboard')}</h1>
            <p>{t('parts_manager.subtitle', 'Monitor inventory and approve mechanic part requests')}</p>
          </div>
          <div className="pm-header-actions">
            <button className="pm-btn-add-part" onClick={openAddPart}>
              <i className="fa-solid fa-plus"></i> {t('parts_manager.add_part', 'Add Part')}
            </button>
            <button className="pm-btn-add-service" onClick={openAddService}>
              <i className="fa-solid fa-plus"></i> {t('parts_manager.add_service', 'Add Service')}
            </button>
          </div>
        </div>

        {message && <div className={`pm-alert ${messageType}`}>{message}</div>}

        {/* KPI Cards */}
        <div className="pm-kpis">
          <div className="pm-kpi-card pm-kpi-blue" onClick={() => { setActiveTab('inventory'); setSearch(''); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-boxes-stacked"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_total_parts', 'Total Parts')}</p><h2>{kpis.total_parts}</h2></div>
          </div>
          <div className="pm-kpi-card pm-kpi-yellow" onClick={() => { setActiveTab('requests'); setRequestSearch('PENDING'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-clock"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_pending', 'Pending Requests')}</p><h2>{kpis.pending_count}</h2></div>
          </div>
          <div className="pm-kpi-card pm-kpi-red" onClick={() => { setActiveTab('inventory'); setSearch('LOW_STOCK'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <div className="pm-kpi-text"><p>{t('parts_manager.kpi_low_stock', 'Low Stock Alerts')}</p><h2>{kpis.low_stock_count}</h2></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          <button className={`pm-tab ${activeTab === 'inventory' ? 'pm-tab-active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <i className="fa-solid fa-warehouse"></i> {t('parts_manager.tab_inventory', 'Parts Inventory')}
          </button>
          <button className={`pm-tab ${activeTab === 'requests' ? 'pm-tab-active' : ''}`} onClick={() => setActiveTab('requests')}>
            <i className="fa-solid fa-clipboard-list"></i> {t('parts_manager.tab_requests', 'Part Requests')}
            {pendingCount > 0 && <span className="pm-tab-badge">{pendingCount}</span>}
          </button>
        </div>

        {loading ? (
          <div className="pm-card" style={{ padding: '0 12px' }}>
            <SkeletonLoader type="table-rows" cols={6} count={6} />
          </div>
        ) : activeTab === 'inventory' ? (
          /* ===== INVENTORY TAB ===== */
          <div className="pm-card">
            <div className="pm-card-header">
              <h3>{t('parts_manager.tab_inventory', 'Parts Inventory')}</h3>
              <input
                type="text"
                className="pm-search"
                placeholder={t('parts_manager.search_placeholder', 'Search by name, zone, category...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>{t('parts_manager.th_part_name', 'Part Name')}</th>
                    <th>{t('parts_manager.th_reference', 'Reference')}</th>
                    <th>{t('parts_manager.th_zone', 'Zone')}</th>
                    <th>{t('parts_manager.th_category', 'Category')}</th>
                    <th>{t('parts_manager.th_price', 'Price')}</th>
                    <th>{t('parts_manager.th_stock', 'Stock')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length === 0 ? (
                    <tr><td colSpan="6" className="pm-empty-cell">{t('parts_manager.no_parts_found', 'No parts found.')}</td></tr>
                  ) : filteredParts.map(part => (
                    <tr key={part.id} className={part.stock_quantity <= 30 ? 'pm-row-low' : ''}>
                      <td><strong>{part.name}</strong></td>
                      <td><code>{part.reference_number || '—'}</code></td>
                      <td><span className="pm-zone-tag">{part.zone || '—'}</span></td>
                      <td>{part.category || '—'}</td>
                      <td>{Number(part.price).toFixed(2)} MAD</td>
                      <td>
                        <span className={`pm-stock ${part.stock_quantity <= 30 ? 'pm-stock-low' : 'pm-stock-ok'}`}>
                          {part.stock_quantity <= 30 && <i className="fa-solid fa-triangle-exclamation"></i>}
                          {part.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ===== REQUESTS TAB ===== */
          <div className="pm-card">
            <div className="pm-card-header">
              <h3>{t('parts_manager.req_title', 'Part Requests from Mechanics')}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {requestSearch === 'PENDING' && (
                  <button onClick={() => setRequestSearch('')} style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--muted)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-xmark"></i> {t('parts_manager.clear_filter', 'Clear Filter')}
                  </button>
                )}
                <span className="pm-req-count">{requests.length} {t('parts_manager.total_requests', 'total request(s)')}</span>
              </div>
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>{t('parts_manager.th_mechanic', 'Mechanic')}</th>
                    <th>{t('parts_manager.th_part', 'Part')}</th>
                    <th>{t('parts_manager.th_req_qty', 'Req. Qty')}</th>
                    <th>{t('parts_manager.th_in_stock', 'In Stock')}</th>
                    <th>{t('parts_manager.th_repair_vehicle', 'Repair / Vehicle')}</th>
                    <th>{t('parts_manager.th_status', 'Status')}</th>
                    <th>{t('parts_manager.th_notes', 'Notes')}</th>
                    <th>{t('parts_manager.th_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan="8" className="pm-empty-cell">{t('parts_manager.no_requests', 'No part requests yet.')}</td></tr>
                  ) : filteredRequests.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.mechanic?.name || '—'}</strong></td>
                      <td>
                        <strong>{req.part?.name || '—'}</strong>
                        <div className="pm-sub">{req.part?.reference_number}</div>
                      </td>
                      <td><span className="pm-qty-badge">{req.quantity}</span></td>
                      <td>
                        <span className={`pm-stock ${req.part?.stock_quantity < req.quantity ? 'pm-stock-low' : 'pm-stock-ok'}`}>
                          {req.part?.stock_quantity < req.quantity && <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>}
                          {req.part?.stock_quantity || 0}
                        </span>
                      </td>
                      <td>
                        <div>{t('parts_manager.repair', 'Repair')} #{req.repair?.id}</div>
                        <div className="pm-sub">{req.repair?.vehicle?.make} {req.repair?.vehicle?.model}</div>
                      </td>
                      <td>{statusBadge(req.status)}</td>
                      <td className="pm-sub">{req.notes || '—'}</td>
                      <td>
                        {req.status === 'Pending' && (
                          <div className="pm-action-btns">
                            <button className="pm-btn-approve" disabled={actionLoading === req.id} onClick={() => handleApprove(req.id)}>
                              {actionLoading === req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> {t('parts_manager.approve', 'Approve')}</>}
                            </button>
                            <button className="pm-btn-decline" disabled={actionLoading === req.id} onClick={() => setDeclineModal({ show: true, id: req.id, notes: '' })}>
                              <i className="fa-solid fa-xmark"></i> {t('parts_manager.decline', 'Decline')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── DECLINE MODAL ─────────────────────────────────────────────── */}
      {declineModal.show && (
        <div className="pm-modal-overlay" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('parts_manager.modal_decline_title', 'Decline Part Request')}</h2>
            <p>{t('parts_manager.modal_decline_desc', 'Optionally provide a reason for the mechanic.')}</p>
            <textarea
              className="pm-textarea"
              placeholder={t('parts_manager.modal_decline_placeholder', 'Reason / notes (optional)...')}
              value={declineModal.notes}
              onChange={(e) => setDeclineModal(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <div className="pm-modal-actions">
              <button className="pm-btn-cancel" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>{t('parts_manager.modal_cancel', 'Cancel')}</button>
              <button className="pm-btn-decline-confirm" onClick={handleDecline} disabled={actionLoading === declineModal.id}>
                {actionLoading === declineModal.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('parts_manager.modal_confirm_decline', 'Decline Request')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PART MODAL ────────────────────────────────────────────── */}
      {showAddPartModal && (
        <div className="pm-modal-overlay" onClick={closeAddPart}>
          <div className="pm-modal pm-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fa-solid fa-boxes-stacked" style={{ marginRight: '8px', color: 'var(--red)' }}></i>{t('parts_manager.modal_add_part_title', 'Add New Part')}</h2>
            <p>{t('parts_manager.modal_add_part_desc', 'Fill in the details to add a new part to the inventory.')}</p>
            <form onSubmit={handleSubmitPart} noValidate>
              <div className="pm-form-grid">
                <Field label={t('parts_manager.label_part_name', 'Part Name')} name="name" value={partForm.name} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. Brake Pad" />
                <Field label={t('parts_manager.label_zone', 'Zone')} name="zone" value={partForm.zone} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. Brakes" />
                <Field label={t('parts_manager.label_category', 'Category')} name="category" value={partForm.category} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. Pièces principales" />
                <Field label={t('parts_manager.label_reference', 'Reference Number')} name="reference_number" value={partForm.reference_number} onChange={handlePartChange} errors={partFormErrors} placeholder="e.g. REF-0042" required={false} />
                <Field label={t('parts_manager.label_cost', 'Cost (MAD)')} name="cost" type="number" step="0.01" value={partForm.cost} onChange={handlePartChange} errors={partFormErrors} placeholder="0.00" />
                <Field label={t('parts_manager.label_price', 'Price (MAD)')} name="price" type="number" step="0.01" value={partForm.price} onChange={handlePartChange} errors={partFormErrors} placeholder="0.00" />
                <Field label={t('parts_manager.label_stock', 'Stock Quantity')} name="stock_quantity" type="number" step="1" value={partForm.stock_quantity} onChange={handlePartChange} errors={partFormErrors} placeholder="0" />
              </div>
              <div className="pm-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="pm-btn-cancel" onClick={closeAddPart} disabled={submittingPart}>{t('parts_manager.modal_cancel', 'Cancel')}</button>
                <button type="submit" className="pm-btn-submit" disabled={submittingPart}>
                  {submittingPart ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('parts_manager.saving', 'Saving...')}</> : <><i className="fa-solid fa-floppy-disk"></i> {t('parts_manager.save_part', 'Save Part')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD SERVICE MODAL ─────────────────────────────────────────── */}
      {showAddServiceModal && (
        <div className="pm-modal-overlay" onClick={closeAddService}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fa-solid fa-screwdriver-wrench" style={{ marginRight: '8px', color: 'var(--red)' }}></i>{t('parts_manager.modal_add_service_title', 'Add New Service')}</h2>
            <p>{t('parts_manager.modal_add_service_desc', 'Fill in the details to add a new service.')}</p>
            <form onSubmit={handleSubmitService} noValidate>
              <div className="pm-form-grid">
                <Field label={t('parts_manager.label_service_name', 'Service Name')} name="name" value={serviceForm.name} onChange={handleServiceChange} errors={serviceFormErrors} placeholder="e.g. Oil Change" />
                <Field label={t('parts_manager.label_zone', 'Zone')} name="zone" value={serviceForm.zone} onChange={handleServiceChange} errors={serviceFormErrors} placeholder="e.g. Engine" />
                <Field label={t('parts_manager.label_price', 'Price (MAD)')} name="price" type="number" step="0.01" value={serviceForm.price} onChange={handleServiceChange} errors={serviceFormErrors} placeholder="0.00" />
              </div>
              <div className="pm-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="pm-btn-cancel" onClick={closeAddService} disabled={submittingService}>{t('parts_manager.modal_cancel', 'Cancel')}</button>
                <button type="submit" className="pm-btn-submit" disabled={submittingService}>
                  {submittingService ? <><i className="fa-solid fa-spinner fa-spin"></i> {t('parts_manager.saving', 'Saving...')}</> : <><i className="fa-solid fa-floppy-disk"></i> {t('parts_manager.save_service', 'Save Service')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManagerDashboard;