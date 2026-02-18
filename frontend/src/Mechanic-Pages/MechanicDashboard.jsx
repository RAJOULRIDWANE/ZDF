import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import './MechanicDashboard.css';

const MechanicDashboard = () => {
    const navigate = useNavigate();

    // --- State Management ---
    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || 'Mechanic',
        role: localStorage.getItem('USER_ROLE') || 'Mechanic'
    });

    const [repairs, setRepairs] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // --- Estimate Modal State ---
    const [showEstimateModal, setShowEstimateModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [mechanicNotes, setMechanicNotes] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [submittingEstimate, setSubmittingEstimate] = useState(false);

    // --- Helpers ---
    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage(null);
            setMessageType('');
        }, 4000);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'ASAP';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // --- Data Fetching ---
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const [userRes, jobsRes, servicesRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/user', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/mechanic/jobs', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/services', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const userData = {
                name: userRes.data.name || userRes.data.user?.name,
                role: userRes.data.role || userRes.data.user?.role
            };
            setUser(userData);
            localStorage.setItem('USER_NAME', userData.name);
            localStorage.setItem('USER_ROLE', userData.role);

            setRepairs(jobsRes.data.data || []);
            setServices(servicesRes.data || []);

        } catch (err) {
            console.error("Dashboard Error:", err);
            if (err.response && err.response.status === 401) {
                showMessage('Session expired. Please log in again.', 'error');
                localStorage.clear();
                navigate('/login');
            } else {
                showMessage('Failed to load dashboard data.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Initial Load
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // --- Check if job is diagnostic ---
    const isDiagnosticJob = (job) => {
        // Check is_diagnostic flag first
        if (job.is_diagnostic) return true;

        // Check if any service contains "diagnostic" in name
        if (job.services && job.services.length > 0) {
            return job.services.some(service =>
                service.name.toLowerCase().includes('diagnostic')
            );
        }

        return false;
    };

    // --- Actions ---
    const handleStatusUpdate = async (repairId, newStatus) => {
        const token = localStorage.getItem('ACCESS_TOKEN');

        const previousRepairs = [...repairs];
        setRepairs(prevRepairs =>
            prevRepairs.map(r => r.id === repairId ? { ...r, status: newStatus } : r)
        );

        try {
            await axios.patch(
                `http://127.0.0.1:8000/api/mechanic/jobs/${repairId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showMessage(`Repair Status have been modified successfully`, 'success');
        } catch (err) {
            console.error(err);
            setRepairs(previousRepairs);
            showMessage('Failed to update status.', 'error');
        }
    };

    const handleOpenEstimateModal = (job) => {
        setSelectedJob(job);
        setShowEstimateModal(true);
        setSelectedServices([]);
        setMechanicNotes('');
        setServiceSearch('');
    };

    const handleCloseEstimateModal = () => {
        setShowEstimateModal(false);
        setSelectedJob(null);
        setSelectedServices([]);
        setMechanicNotes('');
        setServiceSearch('');
    };

    const handleServiceSelect = (service) => {
        if (selectedServices.some(s => s.id === service.id)) {
            showMessage('Service already added', 'error');
            return;
        }
        setSelectedServices(prev => [...prev, service]);
        setServiceSearch('');
    };

    const handleServiceRemove = (serviceId) => {
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    };

    const handleSubmitEstimate = async () => {
        if (selectedServices.length === 0) {
            showMessage('Please select at least one service', 'error');
            return;
        }
        if (!mechanicNotes.trim()) {
            showMessage('Please add mechanic notes', 'error');
            return;
        }

        setSubmittingEstimate(true);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/mechanic/jobs/${selectedJob.id}/estimate`,
                {
                    service_ids: selectedServices.map(s => s.id),
                    mechanic_notes: mechanicNotes
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update repair status locally
            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === selectedJob.id
                        ? { ...r, status: 'Estimate Sent', services: selectedServices }
                        : r
                )
            );

            showMessage(response.data.message || 'Estimate sent successfully!', 'success');
            handleCloseEstimateModal();
        } catch (err) {
            console.error("Estimate Error:", err);
            showMessage(err.response?.data?.message || 'Failed to submit estimate', 'error');
        } finally {
            setSubmittingEstimate(false);
        }
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            await axios.post('http://127.0.0.1:8000/api/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Logout failed", error);
        }
        localStorage.clear();
        navigate('/login');
    };

    // --- KPI Calculation (Memoized) ---
    const kpiData = useMemo(() => {
        if (!Array.isArray(repairs)) return { ActiveJobs: 0, completed: 0, pending: 0 };
        // Normalize status for KPI calculation to handle case sensitivity
        const normalize = (s) => s?.toLowerCase() || '';
        return {
            ActiveJobs: repairs.filter(r => !normalize(r.status).includes('completed')).length,
            completed: repairs.filter(r => normalize(r.status).includes('completed')).length,
            pending: repairs.filter(r => normalize(r.status).includes('pending')).length
        };
    }, [repairs]);

    // --- Get all services for a job ---
    const getJobServices = (job) => {
        if (job.services && Array.isArray(job.services) && job.services.length > 0) {
            return job.services;
        }
        if (job.service) {
            return [job.service];
        }
        return [];
    };

    // --- Filter services for search ---
    const filteredServices = useMemo(() => {
        if (!serviceSearch) return services;
        const searchLower = serviceSearch.toLowerCase();
        return services.filter(service =>
            service.name.toLowerCase().includes(searchLower) ||
            (service.zone && service.zone.toLowerCase().includes(searchLower))
        );
    }, [services, serviceSearch]);

    // --- Calculate total estimate ---
    const totalEstimate = useMemo(() => {
        return selectedServices.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    }, [selectedServices]);

    // --- Custom Dropdown Component (FIXED) ---
    const StatusDropdown = ({ currentStatus, onStatusChange }) => {
        const [isOpen, setIsOpen] = useState(false);

        // CONFIG: Added 'apiValue' to send exact string DB expects
        const statusConfig = {
            pending: {
                label: 'Pending',
                // icon: 'fa-hourglass-start', 
                colorClass: 'pending',
                apiValue: 'pending'
            },
            progress: {
                label: 'In Progress',
                // icon: 'fa-wrench', 
                colorClass: 'progress',
                apiValue: 'in_progress' // FIX: Uses snake_case for API
            },
            completed: {
                label: 'Completed',
                // icon: 'fa-check-circle', 
                colorClass: 'completed',
                apiValue: 'completed'
            }
        };

        // FIX: Fuzzy matching helper to handle "In Progress" vs "in_progress" vs "progress"
        const getStatusKey = (status) => {
            if (!status) return 'pending';
            const s = status.toLowerCase();
            if (s.includes('progress')) return 'progress';
            if (s.includes('completed')) return 'completed';
            return 'pending';
        };

        const activeKey = getStatusKey(currentStatus);
        const currentConfig = statusConfig[activeKey];

        const handleSelect = (e, key) => {
            e.stopPropagation();
            // FIX: Send the apiValue (e.g. 'in_progress') instead of the key
            onStatusChange(statusConfig[key].apiValue);
            setIsOpen(false);
        };

        return (
            <div
                className="custom-dropdown-wrapper"
                onMouseLeave={() => setIsOpen(false)}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className={`dropdown-trigger ${currentConfig.colorClass}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    <i className={` ${currentConfig.icon}`}></i>
                    <span>{currentConfig.label}</span>
                </button>

                {isOpen && (
                    <div className="dropdown-menu">
                        {Object.keys(statusConfig).map((key) => (
                            <div
                                key={key}
                                className={`dropdown-item ${key === activeKey ? 'active' : ''}`}
                                onClick={(e) => handleSelect(e, key)}
                            >
                                <i className={`fa-solid ${statusConfig[key].icon}`}></i>
                                <span>{statusConfig[key].label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <DashboardNavbar
                    user={user}
                    onLogout={handleLogout}
                    onChangePassword={() => setShowPasswordModal(true)}
                />
            </header>

            <div className='main' style={{ padding: '20px' }}>
                <section className="dashboard-stats">
                    <div className="section-header">
                        <h2>Dashboard</h2>
                    </div>

                    <div className="stats-container">
                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Active Repairs</span>
                                <h2>{kpiData.ActiveJobs}</h2>
                            </div>
                            <div className="stat-icon blue">
                                <i className="fa-solid fa-wrench"></i>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Completed</span>
                                <h2>{kpiData.completed}</h2>
                            </div>
                            <div className="stat-icon green">
                                <i className="fa-solid fa-check"></i>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-info">
                                <span>Awaiting tasks</span>
                                <h2>{kpiData.pending}</h2>
                            </div>
                            <div className="stat-icon orange">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="tasks-section">
                    <div className="section-header">
                        <h2>My Job List</h2>
                        {message && (
                            <div className={`alert-message ${messageType}`} style={{ marginLeft: '20px', display: 'inline-block', padding: '5px 10px', borderRadius: '4px' }}>
                                <span>{message}</span>
                            </div>
                        )}
                    </div>

                    <div className="task-list">
                        {loading ? (
                            <div className="section-loading">
                                <div className="spinner-mini"></div>
                                <span>Loading jobs...</span>
                            </div>
                        ) : repairs.length === 0 ? (
                            <div className="no-tasks">
                                <p>🎉 You have no assigned jobs at the moment.</p>
                            </div>
                        ) : (
                            repairs.map(job => (
                                <div
                                    key={job.id}
                                    className={`task-card ${job.status?.toLowerCase().includes('completed') ? 'card-completed' : ''}`}
                                    onClick={() => {
                                        if (!job.status?.toLowerCase().includes('completed')) {
                                            navigate(`/mechanic/repair/${job.id}`);
                                        }
                                    }}
                                    style={{
                                        cursor: !job.status?.toLowerCase().includes('completed') ? 'pointer' : 'default',
                                        opacity: job.status?.toLowerCase().includes('completed') ? 0.7 : 1
                                    }}
                                >
                                    <div className="task-details">
                                        {/* Services Badges */}
                                        <div className="services-badges">
                                            {getJobServices(job).map((service, idx) => (
                                                <span key={idx} className="service-badge">
                                                    {service.name}
                                                </span>
                                            ))}
                                            {isDiagnosticJob(job) && (
                                                <span className="diagnostic-badge" >
                                                    <i class="fa-brands fa-sistrix"></i> DIAGNOSTIC
                                                </span>
                                            )}
                                        </div>

                                        {/* Client Name */}
                                        <span className="client-name">
                                            <i className="fa-solid fa-user"></i>
                                            {job.vehicle?.owner_name || 'Unknown Client'}
                                        </span>

                                        {/* Car Model */}
                                        <span className="car-model">
                                            <i className="fa-solid fa-car"></i>
                                            {job.vehicle?.make} {job.vehicle?.model} ( {job.vehicle?.plate_number || 'N/A'} )
                                        </span>

                                        {/* Due Date */}
                                        <span className="due-date">
                                            <i className="fa-solid fa-calendar"></i> Due: {formatDate(job.date_end)}
                                        </span>

                                        {/* Description */}
                                        <span className='DESC' title={job.description}>
                                            <i className="fa-solid fa-circle-info"></i>
                                            {job.description ? (job.description.length > 50 ? job.description.substring(0, 50) + '...' : job.description) : 'No description'}
                                        </span>
                                    </div>

                                    <div className="task-action" onClick={(e) => e.stopPropagation()}>
                                        {/* Show Submit Estimate button for diagnostic jobs in Pending status */}
                                        {isDiagnosticJob(job) && job.status === 'Pending' && (
                                            <button
                                                className="btn-estimate"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenEstimateModal(job);
                                                }}
                                            >
                                                <i className="fa-solid fa-file-invoice"></i> Submit Estimate
                                            </button>
                                        )}
                                        <StatusDropdown
                                            currentStatus={job.status}
                                            onStatusChange={(newStatus) => handleStatusUpdate(job.id, newStatus)}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Estimate Modal */}
            {showEstimateModal && selectedJob && (
                <div className="modal-overlay" onClick={handleCloseEstimateModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2>Submit Estimate - {selectedJob.vehicle?.make} {selectedJob.vehicle?.model}</h2>

                        {/* Selected Services */}
                        {selectedServices.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Selected Services:</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {selectedServices.map(service => (
                                        <span key={service.id} style={{
                                            background: '#e3f2fd',
                                            color: '#005DFFFF',
                                            padding: '6px 10px',
                                            borderRadius: '15px',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: '1px solid #b3d7ff'
                                        }}>
                                            {service.name} - {service.zone} ({service.price} MAD)
                                            <i
                                                className="fa-solid fa-xmark"
                                                style={{ cursor: 'pointer', color: '#ff4d4d' }}
                                                onClick={() => handleServiceRemove(service.id)}
                                            ></i>
                                        </span>
                                    ))}
                                </div>
                                <p style={{ marginTop: '8px', fontWeight: '700', color: '#005DFFFF' }}>
                                    Total Estimate: {totalEstimate.toFixed(2)} MAD
                                </p>
                            </div>
                        )}

                        {/* Service Search */}
                        <div className="form-group" style={{ position: 'relative', marginBottom: '15px' }}>
                            <label>Add Services:</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search services..."
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                            />
                            {serviceSearch && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    zIndex: 1000,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map(service => (
                                            <div
                                                key={service.id}
                                                onClick={() => handleServiceSelect(service)}
                                                style={{
                                                    padding: '10px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #eee',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                            >
                                                <span>{service.name} - {service.zone}</span>
                                                <span style={{ fontWeight: '600', color: '#005DFFFF' }}>{service.price} MAD</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '10px', color: '#666' }}>No services found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mechanic Notes */}
                        <div className="form-group">
                            <label>Mechanic Notes:</label>
                            <textarea
                                className="form-control"
                                placeholder="Describe the issues found and recommended repairs..."
                                value={mechanicNotes}
                                onChange={(e) => setMechanicNotes(e.target.value)}
                                rows="4"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Modal Actions */}
                        <div className="modal-actions" style={{ marginTop: '20px' }}>
                            <button
                                type="button"
                                className="save-btn"
                                onClick={handleSubmitEstimate}
                                disabled={submittingEstimate}
                            >
                                {submittingEstimate ? (
                                    <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                                ) : (
                                    'Submit Estimate'
                                )}
                            </button>
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={handleCloseEstimateModal}
                                disabled={submittingEstimate}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MechanicDashboard;