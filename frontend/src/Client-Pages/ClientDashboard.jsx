import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import DashboardNavbar from '../components/DashboardNavbar';
import SkeletonLoader from '../components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import './ClientDashboard.css';

const ClientDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [user, setUser] = useState({
        name: localStorage.getItem('USER_NAME') || 'Client',
        email: '',
        role: 'Client'
    });

    const [repairs, setRepairs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState({ vehicles: 0, appointments: 0, invoices: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('');

    const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', license_plate: '', year: '', type: 'car' });
    const [submittingVehicle, setSubmittingVehicle] = useState(false);

    // --- Appointment State ---
    const [appointments, setAppointments] = useState([]);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState({ vehicle_id: '', preferred_date: '', description: '' });
    const [submittingAppointment, setSubmittingAppointment] = useState(false);

    // --- Confirmation Modal State ---
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage(null);
            setMessageType('');
        }, 4000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('ACCESS_TOKEN');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const [repairRes, vehicleRes, userRes, apptRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/client/repairs', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/client/vehicles', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/user', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/client/appointments', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            setRepairs(repairRes.data.data || []);
            setVehicles(vehicleRes.data || []);
            setAppointments(apptRes.data || []);

            setUser({
                name: userRes.data.name,
                email: userRes.data.email,
                role: 'Client'
            });

            localStorage.setItem('USER_NAME', userRes.data.name);

            setStats(prev => ({
                ...prev,
                vehicles: vehicleRes.data?.length || 0,
                appointments: (apptRes.data || []).filter(a => a.status === 'Pending').length,
                invoices: repairRes.data.data?.filter(r => r.status === 'Completed').length || 0
            }));

        } catch (err) {
            console.error("Fetch Error:", err);
            if (err.response && err.response.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
            showMessage('Failed to load data. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Confirmation Helper ---
    const askConfirm = (title, message, onConfirm) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null });


    const handleApproveJob = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/jobs/${repairId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'In Progress' } : r
                )
            );
            showMessage(response.data.message || 'Job approved! Work will start soon.', 'success');
        } catch (err) {
            console.error("Approve Error:", err);
            showMessage(err.response?.data?.message || 'Failed to approve job.', 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };


    const handleAcceptEstimate = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/jobs/${repairId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'In Progress' } : r
                )
            );
            showMessage(response.data.message || 'Estimate accepted! Work will start soon.', 'success');
        } catch (err) {
            console.error("Accept Error:", err);
            showMessage(err.response?.data?.message || 'Failed to accept estimate.', 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };


    const handleNegotiateJob = async (repairId) => {
        if (actionLoading) return;
        setActionLoading(repairId);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/api/jobs/${repairId}/negotiate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRepairs(prevRepairs =>
                prevRepairs.map(r =>
                    r.id === repairId ? { ...r, status: 'Negotiation Requested' } : r
                )
            );
            showMessage(response.data.message || 'Discount request sent!', 'success');
        } catch (err) {
            console.error("Negotiate Error:", err);
            showMessage(err.response?.data?.message || 'Failed to request discount.', 'error');
        } finally {
            setActionLoading(null);
            closeConfirm();
        }
    };

    // --- Appointment Handlers ---
    const handleSubmitAppointment = async (e) => {
        e.preventDefault();
        if (!newAppointment.preferred_date) {
            showMessage('Please select a preferred date.', 'error');
            return;
        }
        setSubmittingAppointment(true);
        const token = localStorage.getItem('ACCESS_TOKEN');
        try {
            await axios.post(
                'http://127.0.0.1:8000/api/client/appointments',
                newAppointment,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showMessage('Appointment request submitted!', 'success');
            setShowAppointmentModal(false);
            setNewAppointment({ vehicle_id: '', preferred_date: '', description: '' });
            fetchData();
        } catch (err) {
            showMessage(err.response?.data?.message || 'Failed to request appointment.', 'error');
        } finally {
            setSubmittingAppointment(false);
        }
    };


    const handleDownloadEstimate = async (repair) => {
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

        // F. ESTIMATE META
        const estimateNum = repair.estimate_number || `EST-${repair.id}`;
        const dateIn = repair.created_at ? new Date(repair.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const dateDue = repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB') : "TBD";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("ESTIMATE", 140, 55);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...grayText);
        doc.text(`No: ${estimateNum}`, 140, 62);
        doc.text(`Date In: ${dateIn}`, 140, 67);
        doc.text(`Due Date: ${dateDue}`, 140, 72);

        // G. BILL TO
        doc.setDrawColor(200);
        doc.line(20, 80, 190, 80);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandColor);
        doc.text("ESTIMATE FOR:", 20, 90);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(user.name || "Guest Client", 20, 97);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayText);
        const carInfo = `${repair.vehicle?.type ? repair.vehicle.type.toUpperCase() + ' - ' : ''}${repair.vehicle?.make || ''} ${repair.vehicle?.model || ''} - ${repair.vehicle?.license_plate || repair.vehicle?.plate_number || repair.vehicle?.plate || ''}`;
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

        // I. TABLE ROWS & LOGIC
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

        const hasServices = repair.services && Array.isArray(repair.services) && repair.services.length > 0;
        const hasParts = repair.parts && Array.isArray(repair.parts) && repair.parts.length > 0;

        if (hasServices || hasParts) {
            // 1. Add Services
            if (hasServices) {
                repair.services.forEach(service => {
                    const price = Number(service.price || 0);
                    const qty = Number(service.quantity || 1);
                    if (price > 0) addRow(service.name, qty, price);
                });
            }
            // 2. Add Parts
            if (hasParts) {
                repair.parts.forEach(part => {
                    const qty = Number(part.pivot?.quantity || 1);
                    const price = Number(part.pivot?.price || 0);
                    if (price > 0) addRow(`Part: ${part.name}`, qty, price);
                });
            }
        } else {
            // Fallback: No details found, use the Main Total Cost
            const labor = Number(repair.cost || 0);
            if (labor > 0) {
                addRow(repair.service?.name || "Repair Service (Total)", 1, labor);
            }
        }

        // J. TOTALS
        y += 5;
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(100, y, 190, y);
        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkText);
        doc.text("Estimated Total  : ", 100, y);

        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text(`${grandTotal.toFixed(2)} MAD`, 185, y, { align: "right" });

        // K. NOTES (if any)
        if (repair.mechanic_notes) {
            y += 15;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...darkText);
            doc.text("Notes:", 20, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...grayText);
            const splitNotes = doc.splitTextToSize(repair.mechanic_notes, 170);
            doc.text(splitNotes, 20, y);
        }

        // L. FOOTER
        y = doc.internal.pageSize.height - 20;
        doc.setFontSize(9);
        doc.setTextColor(...grayText);
        doc.setFont("helvetica", "italic");
        doc.text("Please review this estimate carefully before approving.", 105, y, { align: "center" });

        doc.save(`Estimate_${estimateNum}.pdf`);
        showMessage('Estimate downloaded successfully!', 'success');
    };

    const handleDownloadInvoice = async (repair) => {
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
        const invoiceNum = repair.invoice_number || `INV-${repair.id}`;
        const dateIn = repair.created_at ? new Date(repair.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        const dateDue = repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB') : "TBD";

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
        doc.text(user.name || "Guest Client", 20, 97);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grayText);
        const carInfo = `${repair.vehicle?.type ? repair.vehicle.type.toUpperCase() + ' - ' : ''}${repair.vehicle?.make || ''} ${repair.vehicle?.model || ''} - ${repair.vehicle?.license_plate || repair.vehicle?.plate_number || repair.vehicle?.plate || ''}`;
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

        // I. TABLE ROWS & LOGIC
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

        const hasServices = repair.services && Array.isArray(repair.services) && repair.services.length > 0;
        const hasParts = repair.parts && Array.isArray(repair.parts) && repair.parts.length > 0;

        if (hasServices || hasParts) {
            // 1. Add Services
            if (hasServices) {
                repair.services.forEach(service => {
                    const price = Number(service.price || 0);
                    const qty = Number(service.quantity || 1);
                    if (price > 0) addRow(service.name, qty, price);
                });
            }
            // 2. Add Parts
            if (hasParts) {
                repair.parts.forEach(part => {
                    const qty = Number(part.pivot?.quantity || 1);
                    const price = Number(part.pivot?.price || 0);
                    if (price > 0) addRow(`Part: ${part.name}`, qty, price);
                });
            }
        } else {
            // Fallback: No details found, use the Main Total Cost
            const labor = Number(repair.cost || 0);
            if (labor > 0) {
                addRow(repair.service?.name || "Repair Service (Total)", 1, labor);
            }
        }

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
        showMessage('Invoice downloaded successfully!', 'success');
    };

    const handleAddVehicle = () => {
        setShowAddVehicleModal(true);
        setNewVehicle({ make: '', model: '', license_plate: '', year: '', type: 'car' });
    };

    const handleCloseVehicleModal = () => {
        setShowAddVehicleModal(false);
        setNewVehicle({ make: '', model: '', license_plate: '', year: '', type: 'car' });
    };

    const handleSubmitVehicle = async (e) => {
        e.preventDefault();

        if (!newVehicle.make || !newVehicle.model || !newVehicle.license_plate || !newVehicle.year) {
            showMessage('All fields are required', 'error');
            return;
        }

        if (newVehicle.year < 1900 || newVehicle.year > new Date().getFullYear() + 1) {
            showMessage('Please enter a valid year', 'error');
            return;
        }

        setSubmittingVehicle(true);
        const token = localStorage.getItem('ACCESS_TOKEN');

        try {
            await axios.post(
                'http://127.0.0.1:8000/api/vehicles',
                newVehicle,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showMessage('Vehicle added successfully!', 'success');
            handleCloseVehicleModal();
            fetchData();
        } catch (err) {
            console.error('Add Vehicle Error:', err);
            showMessage(err.response?.data?.message || 'Failed to add vehicle', 'error');
        } finally {
            setSubmittingVehicle(false);
        }
    };

    const getStatusType = (status) => {
        if (!status) return 'pending';
        const s = status.toLowerCase().trim().replace(/_/g, ' ');

        if (s === 'completed') return 'completed';
        if (s === 'estimate sent' || s.includes('estimate')) return 'estimate-sent';
        if (s === 'negotiation requested' || s.includes('negotiation')) return 'negotiation';
        if (s === 'in progress' || s === 'progress') return 'in-progress';
        if (s === 'pending') return 'pending';

        return 'pending';
    };

    return (
        <div className="client-space">
            <DashboardNavbar user={user} onLogout={() => { }} />

            <div className="main-content">


                <section className="dashboard-title">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>{t('client.welcome', { name: user.name })}</h2>
                            <p>Manage your vehicles &amp; appointments</p>
                        </div>
                        <button className="btn-appt" onClick={() => setShowAppointmentModal(true)}>
                            <i className="fa-solid fa-calendar-plus"></i> Request Appointment
                        </button>
                    </div>
                </section>

                {message && (
                    <div className={`alert-message ${messageType}`}>
                        <span>{message}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>My Vehicles</label>
                            <h3>{stats.vehicles}</h3>
                        </div>
                        <div className="stat-icon car-bg"><i className="fa-solid fa-car"></i></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>{t('client.next_appointment')}</label>
                            <h3>{stats.appointments}</h3>
                        </div>
                        <div className="stat-icon cal-bg"><i className="fa-solid fa-calendar"></i></div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-text">
                            <label>{t('client.invoices')}</label>
                            <h3>{stats.invoices}</h3>
                        </div>
                        <div className="stat-icon inv-bg"><i className="fa-solid fa-file-invoice"></i></div>
                    </div>
                </div>

                {/* Vehicles Section */}
                <section className="vehicles-section-main">
                    <div className="vehicles-header-row">
                        <h3>My Vehicles</h3>
                        <button className="add-vehicle-btn" onClick={handleAddVehicle}>
                            <i className="fa-solid fa-plus"></i> {t('client.add_vehicle')}
                        </button>
                    </div>

                    <div className="vehicles-display-container">
                        {vehicles.length === 0 ? (
                            <div className="vehicles-empty-state">
                                <i className="fa-solid fa-car" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '10px' }}></i>
                                <p style={{ margin: 0, color: '#64748b' }}>{t('client.no_vehicles')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="vehicles-cards-row">
                                    {vehicles.slice(0, 3).map(v => (
                                        <div key={v.id} className="vehicle-display-card">
                                            <div className="vehicle-card-icon">
                                                <i className="fa-solid fa-car"></i>
                                            </div>
                                            <div className="vehicle-card-info">
                                                <h4>{v.make} {v.model}</h4>
                                                <p>{v.license_plate}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {vehicles.length > 3 && (
                                    <button className="all-vehicles-link" onClick={() => {/* Navigate to vehicles page later */ }}>
                                        {t('client.all_vehicles')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>

                {/* Repairs List */}
                <section className="repairs-list">
                    <h3>{t('client.my_repairs')}</h3>

                    {loading ? (
                        <SkeletonLoader type="repair-rows" count={3} />
                    ) : repairs.length === 0 ? (
                        <div className="empty-state">
                            <i className="fa-solid fa-inbox"></i>
                            <p>{t('client.no_repairs_found')}</p>
                        </div>
                    ) : (
                        repairs.map(repair => (
                            <div key={repair.id} className="repair-row-card">
                                <div className="repair-main">
                                    <div className="repair-type-icon"><i className="fa-solid fa-wrench"></i></div>
                                    <div className="repair-info">
                                        <div className="service-tags">
                                            {repair.services && repair.services.length > 0 ? (
                                                repair.services.map(s => <span key={s.id} className="tag">{s.name}</span>)
                                            ) : (
                                                <span className="tag">{t('client.general_service')}</span>
                                            )}
                                        </div>
                                        <h4>{repair.vehicle?.make} {repair.vehicle?.model}</h4>
                                        <p className="due-date">{t('client.due')}: {repair.date_end ? new Date(repair.date_end).toLocaleDateString('en-GB', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        }) + ' – ' + new Date(repair.date_end).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        }).toUpperCase() : 'TBD'}</p>
                                    </div>
                                </div>

                                <div className="repair-actions">
                                    {repair.status?.toLowerCase() === 'completed' && (
                                        <>
                                            <span className="status-label completed-label">{t('common.status.completed')}</span>
                                            <button className="btn-download" onClick={() => handleDownloadInvoice(repair)}>
                                                {t('client.invoices')}
                                            </button>
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'estimate sent' && (
                                        <>
                                            <span className="status-label ready-label">{t('client.estimate_ready')}</span>
                                            <button className="btn-secondary" onClick={() => handleDownloadEstimate(repair)}>
                                                Download Estimate
                                            </button>
                                            <button
                                                className="btn-accept"
                                                disabled={actionLoading === repair.id}
                                                onClick={() => askConfirm(
                                                    'Accept Estimate',
                                                    'Are you sure you want to accept this estimate? Work will begin immediately.',
                                                    () => handleAcceptEstimate(repair.id)
                                                )}
                                            >
                                                {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('client.accept')}
                                            </button>
                                            <button
                                                className="btn-primary"
                                                disabled={actionLoading === repair.id}
                                                onClick={() => askConfirm(
                                                    'Request Reduction',
                                                    'This will send a discount request to the receptionist. Continue?',
                                                    () => handleNegotiateJob(repair.id)
                                                )}
                                            >
                                                {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('client.request_reduction')}
                                            </button>
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'negotiation requested' && (
                                        <>
                                            <span className="status-label pending-label">{t('client.negotiation_pending')}</span>
                                            <button className="btn-secondary" onClick={() => handleDownloadEstimate(repair)}>
                                                Download Estimate
                                            </button>
                                            <button className="btn-primary" disabled={actionLoading === repair.id} onClick={() => askConfirm(
                                                'Approve Estimate',
                                                'Accept the estimate at the current price? This will start the repair work.',
                                                () => handleApproveJob(repair.id)
                                            )}>
                                                {actionLoading === repair.id ? <i className="fa-solid fa-spinner fa-spin"></i> : t('client.approve')}
                                            </button>
                                            <button className="btn-primary" disabled>{t('client.reduction_requested')}</button>
                                        </>
                                    )}
                                    {repair.status?.toLowerCase() === 'in progress' && (
                                        <span className="status-label progress-label">{t('common.status.in_progress')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'pending' && (
                                        <span className="status-label pending-label">{t('common.status.pending')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'cancelled' && (
                                        <span className="status-label error-label">{t('common.status.cancelled')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'delivered' && (
                                        <span className="status-label ready-label">{t('common.status.delivered')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'ready' && (
                                        <span className="status-label ready-label">{t('common.status.ready')}</span>
                                    )}
                                    {repair.status?.toLowerCase() === 'diagnostic' && (
                                        <span className="status-label pending-label">{t('common.status.diagnostic')}</span>
                                    )}
                                    {/* Fallback for anything else */}
                                    {![
                                        'completed', 'estimate sent', 'negotiation requested',
                                        'in progress', 'pending', 'cancelled', 'delivered',
                                        'ready', 'diagnostic'
                                    ].includes(repair.status?.toLowerCase()) && (
                                            <span className="status-label pending-label">{repair.status}</span>
                                        )}
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* Appointments Section */}
                <section className="appointments-section">
                    <h3><i className="fa-solid fa-calendar-days"></i> {t('client.next_appointment')}</h3>
                    {loading ? null : appointments.length === 0 ? (
                        <div className="appt-empty">No appointment requests yet.</div>
                    ) : (
                        <div className="appt-list">
                            {appointments.map(appt => (
                                <div key={appt.id} className="appt-card">
                                    <div className="appt-info">
                                        <p className="appt-date"><i className="fa-regular fa-calendar"></i> {new Date(appt.preferred_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        {appt.vehicle && <p className="appt-vehicle"><i className="fa-solid fa-car"></i> {appt.vehicle.make} {appt.vehicle.model}</p>}
                                        {appt.description && <p className="appt-desc">{appt.description}</p>}
                                        {appt.receptionist_notes && <p className="appt-notes"><i className="fa-solid fa-comment"></i> {appt.receptionist_notes}</p>}
                                    </div>
                                    <span className={`appt-badge appt-${appt.status.toLowerCase()}`}>{appt.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Add Vehicle Modal */}
            {showAddVehicleModal && (
                <div className="modal-overlay" onClick={handleCloseVehicleModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{t('client.modal_add_title')}</h2>
                        <form onSubmit={handleSubmitVehicle}>
                            <div className="form-group">
                                <label>{t('client.modal_maker')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('client.modal_maker_placeholder')}
                                    value={newVehicle.make}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('client.modal_model')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('client.modal_model_placeholder')}
                                    value={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('client.modal_license_plate')} <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder={t('client.modal_plate_placeholder')}
                                    value={newVehicle.license_plate}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('client.modal_year')} <span className="required">*</span></label>
                                <input
                                    type="number"
                                    placeholder="e.g., 2020"
                                    value={newVehicle.year}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type <span className="required">*</span></label>
                                <select
                                    value={newVehicle.type}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                                    required
                                >
                                    <option value="car">Car</option>
                                    <option value="bus">Bus</option>
                                    <option value="truck">Truck</option>
                                    <option value="moto">Moto</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCloseVehicleModal}
                                    disabled={submittingVehicle}
                                >
                                    {t('client.modal_cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={submittingVehicle}
                                >
                                    {submittingVehicle ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i> {t('client.modal_adding')}
                                        </>
                                    ) : (
                                        t('client.modal_add_button')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment Request Modal */}
            {showAppointmentModal && (
                <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2><i className="fa-solid fa-calendar-plus"></i> Request Appointment</h2>
                        <form onSubmit={handleSubmitAppointment}>
                            <div className="form-group">
                                <label>Vehicle (optional)</label>
                                <select
                                    value={newAppointment.vehicle_id}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, vehicle_id: e.target.value })}
                                >
                                    <option value="">-- No specific vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Preferred Date <span className="required">*</span></label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={newAppointment.preferred_date}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, preferred_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description / Issue</label>
                                <textarea
                                    placeholder="Describe the issue or reason for your visit..."
                                    value={newAppointment.description}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical' }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowAppointmentModal(false)} disabled={submittingAppointment}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={submittingAppointment}>
                                    {submittingAppointment ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content confirm-modal">
                        <div className="confirm-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
                        <h2>{confirmModal.title}</h2>
                        <p className="confirm-message">{confirmModal.message}</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={closeConfirm}>Cancel</button>
                            <button className="save-btn" onClick={confirmModal.onConfirm}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
