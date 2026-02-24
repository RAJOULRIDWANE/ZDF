import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import './PartsManagerDashboard.css';

const BASE = 'http://127.0.0.1:8000/api';

const PartsManagerDashboard = () => {
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
  const [requestSearch, setRequestSearch] = useState(''); // NEW: for requests filter
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [declineModal, setDeclineModal] = useState({ show: false, id: null, notes: '' });

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
      if (err.response?.status === 401) { localStorage.clear(); navigate('/login'); }
      showMsg('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    localStorage.clear();
    navigate('/login');
  };

  const filteredParts = parts.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.zone?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
    (search === 'LOW_STOCK' && p.stock_quantity <= 30) // Magic string for low stock filter
  );

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const pendingCount = pendingRequests.length;

  const filteredRequests = requests.filter(r =>
    !requestSearch || (requestSearch === 'PENDING' ? r.status === 'Pending' : true)
  );

  const statusBadge = (status) => {
    const map = {
      Pending: 'badge-pending',
      Approved: 'badge-approved',
      Declined: 'badge-declined',
    };
    return <span className={`pm-badge ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <div className="pm-container">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="pm-main">
        {/* Header */}
        <div className="pm-header">
          <div>
            <h1>Parts Manager Dashboard</h1>
            <p>Monitor inventory and approve mechanic part requests</p>
          </div>
        </div>

        {message && <div className={`pm-alert ${messageType}`}>{message}</div>}

        {/* KPI Cards */}
        <div className="pm-kpis">
          <div className="pm-kpi-card pm-kpi-blue" onClick={() => { setActiveTab('inventory'); setSearch(''); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-boxes-stacked"></i></div>
            <div className="pm-kpi-text">
              <p>Total Parts</p>
              <h2>{kpis.total_parts}</h2>
            </div>
          </div>
          <div className="pm-kpi-card pm-kpi-yellow" onClick={() => { setActiveTab('requests'); setRequestSearch('PENDING'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-clock"></i></div>
            <div className="pm-kpi-text">
              <p>Pending Requests</p>
              <h2>{kpis.pending_count}</h2>
            </div>
          </div>
          <div className="pm-kpi-card pm-kpi-red" onClick={() => { setActiveTab('inventory'); setSearch('LOW_STOCK'); }} style={{ cursor: 'pointer' }}>
            <div className="pm-kpi-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <div className="pm-kpi-text">
              <p>Low Stock Alerts</p>
              <h2>{kpis.low_stock_count}</h2>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pm-tabs">
          <button
            className={`pm-tab ${activeTab === 'inventory' ? 'pm-tab-active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <i className="fa-solid fa-warehouse"></i> Parts Inventory
          </button>
          <button
            className={`pm-tab ${activeTab === 'requests' ? 'pm-tab-active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="fa-solid fa-clipboard-list"></i> Part Requests
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
              <h3>Parts Inventory</h3>
              <input
                type="text"
                className="pm-search"
                placeholder="Search by name, zone, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Reference</th>
                    <th>Zone</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length === 0 ? (
                    <tr><td colSpan="6" className="pm-empty-cell">No parts found.</td></tr>
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
              <h3>Part Requests from Mechanics</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {requestSearch === 'PENDING' && (
                  <button
                    onClick={() => setRequestSearch('')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-light)',
                      color: 'var(--muted)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className="fa-solid fa-xmark"></i> Clear Filter
                  </button>
                )}
                <span className="pm-req-count">{requests.length} total request{requests.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Mechanic</th>
                    <th>Part</th>
                    <th>Req. Qty</th>
                    <th>In Stock</th>
                    <th>Repair / Vehicle</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan="8" className="pm-empty-cell">No part requests yet.</td></tr>
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
                        <div>Repair #{req.repair?.id}</div>
                        <div className="pm-sub">{req.repair?.vehicle?.make} {req.repair?.vehicle?.model}</div>
                      </td>
                      <td>{statusBadge(req.status)}</td>
                      <td className="pm-sub">{req.notes || '—'}</td>
                      <td>
                        {req.status === 'Pending' && (
                          <div className="pm-action-btns">
                            <button
                              className="pm-btn-approve"
                              disabled={actionLoading === req.id}
                              onClick={() => handleApprove(req.id)}
                            >
                              {actionLoading === req.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-check"></i> Approve</>}
                            </button>
                            <button
                              className="pm-btn-decline"
                              disabled={actionLoading === req.id}
                              onClick={() => setDeclineModal({ show: true, id: req.id, notes: '' })}
                            >
                              <i className="fa-solid fa-xmark"></i> Decline
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

      {/* Decline Modal */}
      {declineModal.show && (
        <div className="pm-modal-overlay" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Decline Part Request</h2>
            <p>Optionally provide a reason for the mechanic.</p>
            <textarea
              className="pm-textarea"
              placeholder="Reason / notes (optional)..."
              value={declineModal.notes}
              onChange={(e) => setDeclineModal(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
            <div className="pm-modal-actions">
              <button className="pm-btn-cancel" onClick={() => setDeclineModal({ show: false, id: null, notes: '' })}>Cancel</button>
              <button className="pm-btn-decline-confirm" onClick={handleDecline} disabled={actionLoading === declineModal.id}>
                {actionLoading === declineModal.id ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Decline Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManagerDashboard;