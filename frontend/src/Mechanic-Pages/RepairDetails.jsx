import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Repairdetails.css';
import DashboardNavbar from '../components/DashboardNavbar';

const RepairDetails = () => {
    const { t } = useTranslation();
    const { jobId } = useParams();
    const navigate = useNavigate();

    // State
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState('all');
    const [selectedServices, setSelectedServices] = useState([]);
    const [parts, setParts] = useState([]); // Kept for compatibility if needed
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Static Parts Data
    const services = [
        { id: 1, name: 'Bloc moteur', zone: 'engine', category: 'Pièces principales' },
        { id: 2, name: 'Culasse', zone: 'engine', category: 'Pièces principales' },
        { id: 3, name: 'Joint de culasse', zone: 'engine', category: 'Pièces principales' },
        { id: 4, name: 'Pistons', zone: 'engine', category: 'Pièces principales' },
        { id: 5, name: 'Segments de piston', zone: 'engine', category: 'Pièces principales' },
        { id: 6, name: 'Bielles', zone: 'engine', category: 'Pièces principales' },
        { id: 7, name: 'Vilebrequin', zone: 'engine', category: 'Pièces principales' },
        { id: 8, name: 'Arbre à cames', zone: 'engine', category: 'Pièces principales' },
        { id: 9, name: 'Soupapes (admission / échappement)', zone: 'engine', category: 'Pièces principales' },
        { id: 10, name: 'Ressorts de soupapes', zone: 'engine', category: 'Pièces principales' },
        { id: 11, name: 'Injecteurs', zone: 'engine', category: 'Système d’alimentation' },
        { id: 12, name: 'Pompe à carburant', zone: 'engine', category: 'Système d’alimentation' },
        { id: 13, name: 'Filtre à carburant', zone: 'engine', category: 'Système d’alimentation' },
        { id: 14, name: 'Rampe d’injection', zone: 'engine', category: 'Système d’alimentation' },
        { id: 15, name: 'Corps papillon', zone: 'engine', category: 'Système d’alimentation' },
        { id: 16, name: 'Bougies d’allumage', zone: 'engine', category: 'Allumage' },
        { id: 17, name: 'Bobines d’allumage', zone: 'engine', category: 'Allumage' },
        { id: 18, name: 'Faisceau d’allumage', zone: 'engine', category: 'Allumage' },
        { id: 19, name: 'Capteur PMH (vilebrequin)', zone: 'engine', category: 'Allumage' },
        { id: 20, name: 'Pompe à huile', zone: 'engine', category: 'Lubrification' },
        { id: 21, name: 'Filtre à huile', zone: 'engine', category: 'Lubrification' },
        { id: 22, name: 'Carter d’huile', zone: 'engine', category: 'Lubrification' },
        { id: 23, name: 'Joint de carter', zone: 'engine', category: 'Lubrification' },
        { id: 24, name: 'Sonde de pression d’huile', zone: 'engine', category: 'Lubrification' },
        { id: 26, name: 'Radiateur', zone: 'engine', category: 'Refroidissement' },
        { id: 27, name: 'Ventilateur moteur', zone: 'engine', category: 'Refroidissement' },
        { id: 28, name: 'Thermostat (calorstat)', zone: 'engine', category: 'Refroidissement' },
        { id: 29, name: 'Pompe à eau', zone: 'engine', category: 'Refroidissement' },
        { id: 30, name: 'Durites de refroidissement', zone: 'engine', category: 'Refroidissement' },
        { id: 31, name: 'Vase d’expansion', zone: 'engine', category: 'Refroidissement' },
        { id: 32, name: 'Courroie de distribution', zone: 'engine', category: 'Distribution' },
        { id: 33, name: 'Chaîne de distribution', zone: 'engine', category: 'Distribution' },
        { id: 34, name: 'Galet tendeur', zone: 'engine', category: 'Distribution' },
        { id: 35, name: 'Poulie vilebrequin', zone: 'engine', category: 'Distribution' },
        { id: 36, name: 'Pneus', zone: 'wheels', category: 'Roues' },
        { id: 37, name: 'Jantes', zone: 'wheels', category: 'Roues' },
        { id: 38, name: 'Enjoliveurs', zone: 'wheels', category: 'Roues' },
        { id: 39, name: 'Boulons / écrous de roue', zone: 'wheels', category: 'Roues' },
        { id: 40, name: 'Valves de pneus', zone: 'wheels', category: 'Roues' },
        { id: 41, name: 'Disques de frein', zone: 'wheels', category: 'Freinage' },
        { id: 42, name: 'Plaquettes de frein', zone: 'wheels', category: 'Freinage' },
        { id: 43, name: 'Étriers de frein', zone: 'wheels', category: 'Freinage' },
        { id: 44, name: 'Flexibles de frein', zone: 'wheels', category: 'Freinage' },
        { id: 45, name: 'Maître-cylindre', zone: 'wheels', category: 'Freinage' },
        { id: 46, name: 'Tambours de frein (arrière)', zone: 'wheels', category: 'Freinage' },
        { id: 47, name: 'Amortisseurs', zone: 'wheels', category: 'Suspension & direction' },
        { id: 48, name: 'Ressorts', zone: 'wheels', category: 'Suspension & direction' },
        { id: 49, name: 'Bras de suspension', zone: 'wheels', category: 'Suspension & direction' },
        { id: 50, name: 'Rotules', zone: 'wheels', category: 'Suspension & direction' },
        { id: 51, name: 'Silentblocs', zone: 'wheels', category: 'Suspension & direction' },
        { id: 52, name: 'Barre stabilisatrice', zone: 'wheels', category: 'Suspension & direction' },
        { id: 53, name: 'Biellette de direction', zone: 'wheels', category: 'Suspension & direction' },
        { id: 54, name: 'Crémaillère de direction', zone: 'wheels', category: 'Suspension & direction' },
        { id: 55, name: 'Collecteur d’échappement', zone: 'exhaust', category: 'Échappement' },
        { id: 56, name: 'Joint de collecteur', zone: 'exhaust', category: 'Échappement' },
        { id: 57, name: 'Catalyseur', zone: 'exhaust', category: 'Échappement' },
        { id: 58, name: 'Filtre à particules (FAP / DPF)', zone: 'exhaust', category: 'Échappement' },
        { id: 59, name: 'Sonde lambda', zone: 'exhaust', category: 'Échappement' },
        { id: 60, name: 'Silencieux (avant / arrière)', zone: 'exhaust', category: 'Échappement' },
        { id: 61, name: 'Ligne d’échappement', zone: 'exhaust', category: 'Échappement' },
        { id: 62, name: 'Colliers d’échappement', zone: 'exhaust', category: 'Échappement' },
        { id: 63, name: 'Supports en caoutchouc', zone: 'exhaust', category: 'Échappement' },
        { id: 64, name: 'Phares avant', zone: 'lights', category: 'Éclairage avant' },
        { id: 65, name: 'Ampoules (halogène, LED, xénon)', zone: 'lights', category: 'Éclairage avant' },
        { id: 66, name: 'Clignotants avant', zone: 'lights', category: 'Éclairage avant' },
        { id: 67, name: 'Feux de position', zone: 'lights', category: 'Éclairage avant' },
        { id: 68, name: 'Feux arrière', zone: 'lights', category: 'Éclairage arrière' },
        { id: 69, name: 'Feux stop', zone: 'lights', category: 'Éclairage arrière' },
        { id: 70, name: 'Feux de recul', zone: 'lights', category: 'Éclairage arrière' },
        { id: 71, name: 'Clignotants arrière', zone: 'lights', category: 'Éclairage arrière' },
        { id: 72, name: 'Feux antibrouillard', zone: 'lights', category: 'Autres' },
        { id: 73, name: 'Feu de plaque', zone: 'lights', category: 'Autres' },
        { id: 74, name: 'Fusibles', zone: 'lights', category: 'Autres' },
        { id: 75, name: 'Relais', zone: 'lights', category: 'Autres' },
        { id: 76, name: 'Commodo d’éclairage', zone: 'lights', category: 'Autres' },
        { id: 77, name: 'Pare-chocs avant / arrière', zone: 'body', category: 'Parties extérieures' },
        { id: 78, name: 'Capot', zone: 'body', category: 'Parties extérieures' },
        { id: 79, name: 'Ailes', zone: 'body', category: 'Parties extérieures' },
        { id: 80, name: 'Portes', zone: 'body', category: 'Parties extérieures' },
        { id: 81, name: 'Coffre / hayon', zone: 'body', category: 'Parties extérieures' },
        { id: 82, name: 'Rétroviseurs', zone: 'body', category: 'Parties extérieures' },
        { id: 83, name: 'Calandre', zone: 'body', category: 'Parties extérieures' },
        { id: 84, name: 'Pare-brise', zone: 'body', category: 'Vitres & joints' },
        { id: 85, name: 'Vitres latérales', zone: 'body', category: 'Vitres & joints' },
        { id: 86, name: 'Lunette arrière', zone: 'body', category: 'Vitres & joints' },
        { id: 87, name: 'Joints de portes', zone: 'body', category: 'Vitres & joints' },
        { id: 88, name: 'Lève-vitres (manuel / électrique)', zone: 'body', category: 'Vitres & joints' },
        { id: 89, name: 'Agrafes', zone: 'body', category: 'Fixations & accessoires' },
        { id: 90, name: 'Clips', zone: 'body', category: 'Fixations & accessoires' },
        { id: 91, name: 'Vis carrosserie', zone: 'body', category: 'Fixations & accessoires' },
        { id: 92, name: 'Supports', zone: 'body', category: 'Fixations & accessoires' },
        { id: 93, name: 'Garnitures intérieures', zone: 'body', category: 'Fixations & accessoires' },
        { id: 94, name: 'Carburateur (anciens véhicules)', zone: 'engine', category: 'Système d’alimentation' },
    ];

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('ACCESS_TOKEN');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [jobResponse, userResponse] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000/api/mechanic/jobs/${jobId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://127.0.0.1:8000/api/user', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                // Handle data wrapper
                const jobData = jobResponse.data.data || jobResponse.data;
                console.log("Job Data Processed:", jobData);

                setJob(jobData);
                setUser(userResponse.data);
            } catch (error) {
                console.error('Failed to fetch details:', error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [jobId, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('USER_ROLE');
        navigate('/login');
    };

    const getClientName = () => {
        if (!job) return '';
        if (job.vehicle?.owner_name) return job.vehicle.owner_name;
        if (job.vehicle?.client?.name) return job.vehicle.client.name;
        if (job.vehicle?.user?.name) return job.vehicle.user.name;
        if (job.client?.name) return job.client.name;
        return t('mechanic.unknown_client');
    };

    // Filter logic
    const filteredServices = services.filter(s => {
        const matchZone = selectedZone === 'all' || s.zone === selectedZone;
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchZone && matchSearch;
    });

    // Group by category
    const groupedServices = filteredServices.reduce((groups, service) => {
        const category = service.category;
        if (!groups[category]) groups[category] = [];
        groups[category].push(service);
        return groups;
    }, {});

    // Cart Logic
    const toggleService = (service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) return prev.filter(s => s.id !== service.id);
            return [...prev, { ...service, quantity: 1 }];
        });
    };

    const updateQuantity = (id, change) => {
        setSelectedServices(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + change);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeItem = (id) => {
        setSelectedServices(prev => prev.filter(item => item.id !== id));
    };

    const totalItems = selectedServices.reduce((sum, item) => sum + item.quantity, 0);

    const sendPartsRequest = async () => {
        if (selectedServices.length === 0 && parts.length === 0) {
            alert(t('mechanic.details.no_parts_error'));
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('ACCESS_TOKEN');
            const combinedParts = [
                ...selectedServices.map(s => ({ name: s.name, quantity: s.quantity })),
                ...parts.map(p => ({ name: p.name, quantity: p.quantity }))
            ];

            const requestData = {
                job_id: jobId,
                vehicle: {
                    make: job.vehicle?.make,
                    model: job.vehicle?.model,
                    license_plate: job.vehicle?.plate_number || job.vehicle?.license_plate
                },
                parts: combinedParts,
                notes: `Parts request for job #${jobId} - ${getClientName()}`
            };

            await axios.post('http://127.0.0.1:8000/api/mechanic/parts-request', requestData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowConfirmation(true);
        } catch (error) {
            console.error('Failed to send parts request:', error);
            alert(t('mechanic.details.send_error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="dashboard-container">
            <DashboardNavbar user={user || { name: 'Mechanic', role: 'Mechanic' }} />
            <div className="loading-state">
                <div className="spinner-mini"></div>
                <p>{t('mechanic.details.loading')}</p>
            </div>
        </div>
    );

    if (!job) return (
        <div className="repair-details-container">
            <DashboardNavbar user={user} onLogout={handleLogout} />
            <div className="error-state">
                <h2>{t('mechanic.details.not_found')}</h2>
                <button
                    className="btn-error-action"
                    onClick={() => navigate('/mechanic/dashboard')}
                >
                    {t('mechanic.details.return_dashboard')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="repair-details-container">
            <header className="dashboard-header">
                <DashboardNavbar user={user} onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} />
            </header>

            <div className="repair-content-wrapper">
                <div className="back-link-container">
                    <Link to="/mechanic/dashboard" className="back-link">
                        <i className="fa-solid fa-arrow-left"></i> {t('mechanic.details.back')}
                    </Link>
                </div>

                {!showConfirmation ? (
                    <div className="repair-content">
                        {/* --- VEHICLE INFORMATION SECTION --- */}
                        <section className="vehicle-info-section">
                            <h2>
                                <i className="fa-solid fa-car"></i> {t('mechanic.details.title')}
                            </h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>{t('mechanic.details.client_name')}</label>
                                    <input type="text" value={getClientName()} readOnly />
                                </div>
                                <div className="info-item">
                                    <label>{t('mechanic.details.make')}</label>
                                    <input type="text" value={job.vehicle?.make || 'N/A'} readOnly />
                                </div>
                                <div className="info-item">
                                    <label>{t('mechanic.details.model')}</label>
                                    <input type="text" value={job.vehicle?.model || 'N/A'} readOnly />
                                </div>
                                <div className="info-item">
                                    <label>{t('mechanic.details.license_plate')}</label>
                                    <input type="text" value={job.vehicle?.plate_number || job.vehicle?.license_plate || 'N/A'} readOnly />
                                </div>

                                <div className="info-item full-width">
                                    <label>{t('mechanic.details.service_requested')}</label>
                                    <div className="service-badges-container">
                                        {/* FIX: Prioritize showing array of services, fallback to single service */}
                                        {job.services && job.services.length > 0 ? (
                                            job.services.map((s, i) => (
                                                <span key={i} className="service-badge">
                                                    {s.name}
                                                </span>
                                            ))
                                        ) : job.service ? (
                                            <span className="service-badge">
                                                {job.service.name}
                                            </span>
                                        ) : (
                                            t('mechanic.details.general_repair')
                                        )}
                                    </div>
                                </div>

                                <div className="info-item full-width">
                                    <label>{t('mechanic.details.description')}</label>
                                    <textarea
                                        value={job.description || t('mechanic.details.no_description')}
                                        readOnly
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        {/* --- PARTS SELECTION SECTION --- */}
                        <section className="services-section">
                            <div className="services-header">
                                <h2><i className="fa-solid fa-toolbox"></i> {t('mechanic.details.select_parts')}</h2>
                                <div className="search-wrapper">
                                    <input
                                        className="search-input"
                                        type="text"
                                        placeholder={t('mechanic.details.search_parts')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <i className="fa-solid fa-search"></i>
                                </div>
                            </div>

                            <div className="zone-filter">
                                {['all', 'engine', 'wheels', 'exhaust', 'lights', 'body'].map(zone => (
                                    <button
                                        key={zone}
                                        className={selectedZone === zone ? 'active' : ''}
                                        onClick={() => setSelectedZone(zone)}
                                    >
                                        {t(`mechanic.details.zones.${zone}`)}
                                    </button>
                                ))}
                            </div>

                            <div className="services-grid-container">
                                {Object.entries(groupedServices).map(([category, items]) => (
                                    <div key={category} className="service-category-group">
                                        <h3 className="category-header">{category}</h3>
                                        <div className="services-grid">
                                            {items.map(service => {
                                                const isSelected = selectedServices.find(s => s.id === service.id);
                                                return (
                                                    <div
                                                        key={service.id}
                                                        className={`service-card ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => toggleService(service)}
                                                    >
                                                        <div className="service-info">
                                                            <h3>{service.name}</h3>
                                                            <span className="service-zone">{t(`mechanic.details.zones.${service.zone}`)}</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="selected-checkmark">
                                                                <i className="fa-solid fa-check-circle"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* --- SUMMARY SECTION --- */}
                        {selectedServices.length > 0 && (
                            <section className="summary-section">
                                <div className="summary-header">
                                    <h3><i className="fa-solid fa-cart-shopping"></i> {t('mechanic.details.order_summary')}</h3>
                                    <span className="badge-count">{t('mechanic.details.items_selected', { count: selectedServices.length })}</span>
                                </div>
                                <div className="summary-list">
                                    <div className="summary-list-header">
                                        <span>{t('mechanic.details.part_name')}</span>
                                        <span>{t('mechanic.details.zone')}</span>
                                        <span>{t('mechanic.details.quantity')}</span>
                                        <span></span>
                                    </div>
                                    {selectedServices.map(item => (
                                        <div key={item.id} className="summary-item-row">
                                            <div><span className="item-name">{item.name}</span></div>
                                            <div><span className="item-zone-tag">{t(`mechanic.details.zones.${item.zone}`)}</span></div>
                                            <div>
                                                <input
                                                    type="number"
                                                    className="qty-custom-input"
                                                    value={item.quantity}
                                                    min="1"
                                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value || 1) - item.quantity)}
                                                />
                                            </div>
                                            <div>
                                                <button className="btn-remove" onClick={() => removeItem(item.id)}>
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-footer">
                                    <div className="total-row">
                                        <span>{t('mechanic.details.total_quantity')}</span>
                                        <span className="total-number">{totalItems}</span>
                                    </div>
                                    <button
                                        className="btn-submit"
                                        onClick={sendPartsRequest}
                                        disabled={submitting}
                                    >
                                        <i className="fa-solid fa-paper-plane"></i> {submitting ? t('mechanic.details.sending') : t('mechanic.details.confirm_send')}
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    /* --- CONFIRMATION VIEW --- */
                    <div className="confirmation-container">
                        <div className="confirmation-success">
                            <div className="success-icon"><i className="fa-solid fa-circle-check"></i></div>
                            <h2>{t('mechanic.details.request_sent')}</h2>
                            <div className="request-summary">
                                <p><strong>{t('mechanic.details.job_id')}:</strong> #{jobId}</p>
                                <p><strong>{t('mechanic.details.vehicle')}:</strong> {job.vehicle?.make} {job.vehicle?.model}</p>
                                <h4>{t('mechanic.details.parts_requested')}:</h4>
                                <ul>
                                    {selectedServices.map(part => (
                                        <li key={part.id}>{part.name} <span className="qty-pill">x{part.quantity}</span></li>
                                    ))}
                                </ul>
                            </div>
                            <div className="confirmation-actions">
                                <button className="btn-secondary" onClick={() => navigate('/mechanic/dashboard')}>
                                    <i className="fa-solid fa-home"></i> {t('mechanic.details.return_dashboard')}
                                </button>
                                <button className="btn-primary" onClick={() => { setShowConfirmation(false); setSelectedServices([]); }}>
                                    <i className="fa-solid fa-plus"></i> {t('mechanic.details.new_request')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepairDetails;
