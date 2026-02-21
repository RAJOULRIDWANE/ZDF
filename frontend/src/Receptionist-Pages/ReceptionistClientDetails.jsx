import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { useTranslation } from 'react-i18next';
import DashboardNavbar from '../components/DashboardNavbar';
import "./ReceptionistClientDetails.css";

const ReceptionistClientDetails = () => {
    const { t } = useTranslation();
    const { id, name } = useParams();
    const navigate = useNavigate();

    // --- 1. STATE MANAGEMENT ---
    const clientNameDisplay = name ? decodeURIComponent(name).replace(/-/g, ' ') : 'Client';

    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || 'Receptionist',
        role: localStorage.getItem('USER_ROLE') || 'Receptionist'
    });

    const [client, setClient] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Loading states
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [negotiatingId, setNegotiatingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');

    // --- 2. EFFECT: FETCH DATA ---
    useEffect(() => {
        if (id) fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const res = await axios.get(`http://127.0.0.1:8000/api/receptionist/client/${id}/repairs`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setClient(res.data.client);
            setRepairs(res.data.repairs);
        } catch (err) {
            console.error("Error fetching details:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- 3. HANDLE STATUS UPDATE (DELIVERED) ---
    const handleUpdateStatus = async (jobId, newStatus) => {
        if (!window.confirm(t('receptionist.details.confirm_delivered', { status: newStatus }))) return;

        try {
            const token = localStorage.getItem('ACCESS_TOKEN');

            // Ensure we send the status in the format the backend likely expects (Title Case)
            await axios.put(`http://127.0.0.1:8000/api/receptionist/repairs/${jobId}/status`,
                { status: newStatus }, // Sending "Delivered"
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update Local State Immediately
            setRepairs(prevRepairs =>
                prevRepairs.map(job =>
                    job.id === jobId ? { ...job, status: newStatus } : job
                )
            );

        } catch (error) {
            console.error("Status update failed", error);
            // Show the exact error from the backend if available
            alert("Failed to update status. " + (error.response?.data?.message || error.response?.data?.error || "Check if repair is fully Completed."));
        }
    };

    // --- NEW: HANDLE NEGOTIATION APPROVAL/REJECTION ---
    const handleNegotiation = async (jobId, decision) => {
        if (negotiatingId) return; // Prevent multiple clicks

        const confirmMsg = decision === 'approve'
            ? t('receptionist.details.accept_discount')
            : t('receptionist.details.reject_discount');

        if (!window.confirm(confirmMsg)) return;

        setNegotiatingId(jobId);

        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const response = await axios.post(
                `http://127.0.0.1:8000/api/receptionist/jobs/${jobId}/negotiate`,
                { decision },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state with new status and cost
            setRepairs(prevRepairs =>
                prevRepairs.map(job =>
                    job.id === jobId
                        ? { ...job, status: 'In Progress', cost: response.data.repair.cost }
                        : job
                )
            );

            // Show success message
            setMessage(response.data.message || 'Negotiation processed successfully');
            setMessageType('success');
            setTimeout(() => {
                setMessage(null);
                setMessageType('');
            }, 4000);

        } catch (error) {
            console.error("Negotiation failed", error);
            setMessage(error.response?.data?.message || 'Failed to process negotiation');
            setMessageType('error');
            setTimeout(() => {
                setMessage(null);
                setMessageType('');
            }, 4000);
        } finally {
            setNegotiatingId(null);
        }
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

    // ==========================================
    //      PDF GENERATOR LOGIC (FIXED)
    // ==========================================
    const generatePDF = async (job) => {
        const doc = new jsPDF();

        // A. HELPER: Load Image
        const getBase64ImageFromUrl = (url) => {
            return new Promise((resolve, reject) => {
                var img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL("image/png");
                    resolve(dataURL);
                };
                img.onerror = error => reject(error);
                img.src = url;
            });
        };

        // B. LOAD LOGO
        let logoData = null;
        try {
            logoData = await getBase64ImageFromUrl("/images/MECHANIC.png");
        } catch (error) {
            console.warn("Logo not found");
        }

        // C. STYLES
        const brandColor = [0, 180, 216];
        const lightGray = [245, 247, 250];
        const darkText = [51, 51, 51];
        const grayText = [128, 128, 128];

        // D. HEADER
        doc.setFillColor(...brandColor);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("MECAPRO", 20, 28);

        if (logoData) doc.addImage(logoData, 'PNG', 160, 5, 30, 30);

        // E. INFO
        doc.setTextColor(...darkText);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("ESTN Selouane", 20, 55);
        doc.text("Nador, Morocco", 20, 60);
        doc.text("mecapro.info@gmail.com", 20, 65);

        // F. INVOICE META
        const invoiceNum = job.invoice_number || `INV-${job.id}`;
        const dateIn = job.created_at ? new Date(job.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const dateDue = job.date_end ? new Date(job.date_end).toLocaleDateString('en-GB') : "TBD";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("INVOICE", 140, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...grayText);
        doc.text(`No: ${invoiceNum}`, 140, 62);
        doc.text(`Date In: ${dateIn}`, 140, 67);
        doc.text(`Due Date: ${dateDue}`, 140, 72);

        // G. BILL TO
        doc.setDrawColor(200);
        doc.line(20, 80, 190, 80);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandColor);
        doc.text("BILL TO:", 20, 90);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(job.vehicle?.client?.name || "Guest Client", 20, 97);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayText);
        const carInfo = `${job.vehicle?.type ? job.vehicle.type.toUpperCase() + ' - ' : ''}${job.vehicle?.make || ''} ${job.vehicle?.model || ''} - ${job.vehicle?.plate_number || job.vehicle?.plate || ''}`;
        doc.text(carInfo, 20, 103);

        // H. TABLE HEADER
        let y = 120;
        doc.setFillColor(...brandColor);
        doc.rect(20, y - 6, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("DESCRIPTION", 25, y);
        doc.text("QTY", 110, y);
        doc.text("PRICE", 140, y);
        doc.text("TOTAL", 185, y, { align: "right" });

        // I. TABLE ROWS & LOGIC FIX
        y += 12;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        let grandTotal = 0;
        let rowIndex = 0;

        const addRow = (description, qty, price) => {
            const lineTotal = qty * price;
            grandTotal += lineTotal;
            if (rowIndex % 2 === 0) {
                doc.setFillColor(...lightGray);
                doc.rect(20, y - 5, 170, 8, 'F');
            }
            doc.text(description, 25, y);
            doc.text(qty.toString(), 110, y);
            doc.text(price.toFixed(2), 140, y);
            doc.text(lineTotal.toFixed(2), 185, y, { align: "right" });
            y += 10;
            rowIndex++;
            if (y > 270) { doc.addPage(); y = 20; rowIndex = 0; }
        };

        // --- FIX STARTS HERE ---
        // We check if we have detailed services. 
        // If YES: We only sum the services. We DO NOT add job.cost (which is likely the cached total).
        // If NO: We use job.cost as a fallback "Lump Sum" (Legacy Data).

        const hasServices = job.services && Array.isArray(job.services) && job.services.length > 0;
        const hasParts = job.parts && Array.isArray(job.parts) && job.parts.length > 0;

        if (hasServices || hasParts) {
            // 1. Add Services
            // 1. Add Services
            if (hasServices) {
                job.services.forEach(service => {
                    const price = Number(service.price || 0);
                    const qty = Number(service.quantity || 1);
                    // Note: If service.quantity doesn't exist in your DB, default to 1
                    if (price > 0) addRow(service.name, qty, price);
                });
            }
            // 2. Add Parts
            if (hasParts) {
                job.parts.forEach(part => {
                    const qty = Number(part.pivot?.quantity || 1);
                    const price = Number(part.pivot?.price || 0);
                    if (price > 0) addRow(`Part: ${part.name}`, qty, price);
                });
            }
        } else {
            // Fallback: No details found, use the Main Total Cost
            const labor = Number(job.cost || 0);
            if (labor > 0) {
                addRow(job.service?.name || "Repair Service (Total)", 1, labor);
            }
        }
        // --- FIX ENDS HERE ---

        // J. TOTALS
        y += 5;
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(100, y, 190, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkText);
        doc.text("Total a payer  : ", 100, y);

        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text(`${grandTotal.toFixed(2)} MAD`, 185, y, { align: "right" });

        // K. FOOTER
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(9);
        doc.setTextColor(...grayText);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you for choosing MecaPro!", 105, y, { align: "center" });

        doc.save(`Invoice_${invoiceNum}.pdf`);
    };

    // --- 4. DOWNLOAD HANDLER ---
    const handleDownloadInvoice = async (jobId) => {
        if (downloadingId === jobId) return;
        setDownloadingId(jobId);

        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const response = await axios.get(`http://127.0.0.1:8000/api/receptionist/repairs/${jobId}/invoice`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle both raw model and Resource wrapper 'data'
            const fullRepairData = response.data.data || response.data;

            await generatePDF(fullRepairData);
        } catch (error) {
            console.error("Could not fetch invoice data:", error);
            alert("Error generating invoice.");
        } finally {
            setDownloadingId(null);
        }
    };

    // --- 5. KPI & HELPERS ---
    const totalSpent = repairs.reduce((sum, job) => sum + Number(job.cost || 0), 0);
    const totalVisits = repairs.length;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todaysAppointments = repairs.filter(r => r.date_end && r.date_end.startsWith(todayStr)).length;

    const completedToday = repairs.filter(r => {
        if (!r.date_end || !r.status) return false;
        const isToday = r.date_end.startsWith(todayStr);
        return isToday && r.status.toLowerCase().trim() === 'completed';
    }).length;

    const deliveredCount = repairs.filter(r => r.status && r.status.toLowerCase().trim() === 'delivered').length;

    const filteredRepairs = repairs.filter(job => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const plate = job.vehicle?.plate_number || job.vehicle?.plate || job.vehicle?.license_plate || '';
        const mechanic = job.mechanic?.name || '';
        const servicesStr = job.services ? job.services.map(s => s.name).join(' ') : (job.service?.name || '');
        return plate.toLowerCase().includes(term) || mechanic.toLowerCase().includes(term) || servicesStr.toLowerCase().includes(term);
    });

    const getBadgeClass = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase().trim();
        if (s === 'progress' || s === 'in progress') return 'in-progress';
        if (s === 'completed') return 'completed';
        if (s === 'delivered') return 'delivered';
        if (s === 'cancelled') return 'cancelled';
        return 'pending';
    };

    // --- 6. RENDER ---
    return (
        <div className="receptionist-container">
            <DashboardNavbar user={user} onLogout={handleLogout} />

            <div className="header-actions">
                <div>
                    <Link to="/receptionist/dashboard" className="back-link-container back-link">
                        ← {t('receptionist.details.back')}
                    </Link>
                    <h1>{t('receptionist.details.history_title', { name: clientNameDisplay })}</h1>
                </div>
            </div>

            {/* KPI SECTION */}
            <div className="kpi-container">
                <div className="kpi-card">
                    <div className="kpi-icon"><i className="fa-regular fa-calendar"></i></div>
                    <div className="kpi-info"><h3>{t('receptionist.details.today_appt')}</h3><p className="kpi-number">{todaysAppointments}</p></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon delivered-icon"><i className="fa-solid fa-handshake"></i></div>
                    <div className="kpi-info"><h3>{t('receptionist.details.delivered')}</h3><p className="kpi-number">{deliveredCount}</p></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon success-icon"><i className="fa-regular fa-circle-check"></i></div>
                    <div className="kpi-info"><h3>{t('receptionist.details.completed_today')}</h3><p className="kpi-number">{completedToday}</p></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><i className="fa-solid fa-wrench"></i></div>
                    <div className="kpi-info"><h3>{t('receptionist.details.total_visits')}</h3><p className="kpi-number">{totalVisits}</p></div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon success-icon"><i className="fa-solid fa-wallet"></i></div>
                    <div className="kpi-info"><h3>{t('receptionist.details.total_spent')}</h3><p className="kpi-number">{totalSpent} MAD</p></div>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`alert-message ${messageType}`} style={{
                    padding: '12px 20px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                    color: messageType === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    textAlign: 'center'
                }}>
                    <span>{message}</span>
                </div>
            )}

            <div className="search-filter-bar">
                <input
                    type="text"
                    placeholder={t('receptionist.details.search_placeholder')}
                    className="dashboard-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>{t('receptionist.details.vehicle')}</th>
                            <th>{t('receptionist.details.type')}</th>
                            <th>{t('receptionist.details.service')}</th>
                            <th>{t('receptionist.details.mechanic')}</th>
                            <th>{t('receptionist.details.cost')}</th>
                            <th>{t('receptionist.details.start_date')}</th>
                            <th>{t('receptionist.details.predicted_end')}</th>
                            <th>{t('receptionist.details.status')}</th>
                            <th>{t('receptionist.details.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: '#005DFFFF' }}></i>
                                <p style={{ marginTop: '10px', color: '#666' }}>{t('receptionist.details.loading_history')}</p>
                            </td></tr>
                        ) : filteredRepairs.length > 0 ? (
                            filteredRepairs.map(job => (
                                <tr key={job.id}>
                                    <td>
                                        <strong>{job.vehicle?.make} {job.vehicle?.model}</strong>
                                        <div className="sub-text">{job.vehicle?.plate_number || job.vehicle?.plate}</div>
                                    </td>
                                    <td><span style={{ textTransform: 'capitalize' }}>{t(`vehicle_types.${job.vehicle?.type?.toLowerCase().trim()}`)}</span></td>

                                    {/* UPDATED SERVICE COLUMN WITH BADGES */}
                                    <td>
                                        <div className="service-badges-container">
                                            {job.services && job.services.length > 0 ? (
                                                job.services.map((service, idx) => (
                                                    <span key={idx} className="service-badge">
                                                        {service.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="service-badge">
                                                    {job.service?.name || t('receptionist.details.general_service')}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td>{job.mechanic ? <span className="mechanic-name">{job.mechanic.name}</span> : <span className="unassigned">{t('receptionist.details.unassigned')}</span>}</td>
                                    <td style={{ fontWeight: 'bold' }}>{job.cost} MAD</td>
                                    <td>{new Date(job.created_at).toLocaleDateString('en-GB')}</td>
                                    <td>{job.date_end ? new Date(job.date_end).toLocaleString('en-GB') : 'TBD'}</td>
                                    <td><span className={`status-badge ${getBadgeClass(job.status)}`}>{t(`common.status.${job.status?.toLowerCase().replace(/\s+/g, '_')}`)}</span></td>
                                    <td>
                                        <button className="action-btn" onClick={() => navigate(`/track-repair/${job.id}`)}>
                                            <i className="fa-solid fa-eye"></i>
                                        </button>

                                        <button className="action-btn invoice-btn" disabled={downloadingId === job.id} onClick={() => handleDownloadInvoice(job.id)}>
                                            {downloadingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-arrow-down"></i>}
                                        </button>

                                        {/* Negotiation Buttons for Negotiation Requested Status */}
                                        {job.status && job.status.toLowerCase().trim() === 'negotiation requested' && (
                                            <>
                                                <button
                                                    className="action-btn accept-reduction"
                                                    // style={{ backgroundColor: '#28a745', color: 'white' }}
                                                    title={t('receptionist.details.btn_accept')}
                                                    disabled={negotiatingId === job.id}
                                                    onClick={() => handleNegotiation(job.id, 'approve')}
                                                >
                                                    {negotiatingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i class="fa-regular fa-circle-check"></i>}
                                                </button>
                                                <button
                                                    className="action-btn decline-reduction"
                                                    // style={{ backgroundColor: '#dc3545', color: 'white' }}
                                                    title={t('receptionist.details.btn_reject')}
                                                    disabled={negotiatingId === job.id}
                                                    onClick={() => handleNegotiation(job.id, 'reject')}
                                                >
                                                    {negotiatingId === job.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i class="fa-regular fa-circle-xmark"></i>}
                                                </button>
                                            </>
                                        )}

                                        {job.status && job.status.toLowerCase().trim() === 'completed' && (
                                            <button
                                                className="action-btn deliver-btn"
                                                title={t('receptionist.details.btn_deliver')}
                                                onClick={() => handleUpdateStatus(job.id, 'Delivered')}
                                            >
                                                <i className="fa-solid fa-car-side"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>{t('receptionist.details.no_repairs')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReceptionistClientDetails;
