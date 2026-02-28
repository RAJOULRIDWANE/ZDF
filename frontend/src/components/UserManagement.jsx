import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SkeletonLoader from './SkeletonLoader';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');      // 'all' | 'mechanic' | 'receptionist'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'disabled'

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'mechanic',
        phone: ''
    });

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

    const getAxiosConfig = () => {
        const token = localStorage.getItem('ACCESS_TOKEN');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${apiBaseUrl}/supervisor/staff`, getAxiosConfig());
            setUsers(response.data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load staff list. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Derived filtered list ──────────────────────────────────────────────
    const filteredUsers = users.filter(user => {
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !term ||
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.role?.toLowerCase().includes(term);

        const matchesRole =
            roleFilter === 'all' || user.role === roleFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'disabled' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData({ name: '', email: '', password: '', role: 'mechanic', phone: '' });
        setSelectedUser(null);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setModalMode('edit');
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            phone: user.phone || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (modalMode === 'add') {
                await axios.post(`${apiBaseUrl}/supervisor/staff`, formData, getAxiosConfig());
            } else {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await axios.put(`${apiBaseUrl}/supervisor/staff/${selectedUser.id}`, updateData, getAxiosConfig());
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.message || 'Failed to save staff member.');
        }
    };

    const toggleStatus = async (userId) => {
        try {
            await axios.patch(`${apiBaseUrl}/supervisor/staff/${userId}/toggle-status`, {}, getAxiosConfig());
            fetchUsers();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="user-management-system">
            {/* Header row */}
            <div className="um-header">
                <h2>Staff Directory</h2>
                <button className="add-btn" onClick={openAddModal}>+ Add New Staff</button>
            </div>

            {/* Filters row */}
            <div className="um-filters">
                <div className="search-wrapper">
                    <i className="ri-search-line search-icon" />
                    <input
                        type="text"
                        className="filter-input search-input"
                        placeholder="Search by name, email or role…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>&times;</button>
                    )}
                </div>

                <select
                    className="filter-select"
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="mechanic">Mechanic</option>
                    <option value="receptionist">Receptionist</option>
                </select>

                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </select>
            </div>

            {/* Error banner (outside modal) */}
            {error && !showModal && <div className="error-alert">{error}</div>}

            {/* Table or Skeleton */}
            <div className="table-container">
                {loading ? (
                    <SkeletonLoader type="table-rows" count={6} cols={6} />
                ) : (
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">
                                        No staff members match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className={!user.is_active ? 'disabled-row' : ''}>
                                        <td>#{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.is_active ? 'active' : 'disabled'}`}>
                                                {user.is_active ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button className="edit-btn" onClick={() => openEditModal(user)}>Edit</button>
                                            <button
                                                className={`toggle-btn ${user.is_active ? 'disable' : 'enable'}`}
                                                onClick={() => toggleStatus(user.id)}
                                            >
                                                {user.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Result count */}
            {!loading && (
                <p className="results-count">
                    Showing {filteredUsers.length} of {users.length} staff members
                </p>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header-sup">
                            <h3>{modalMode === 'add' ? 'Create New Staff' : 'Edit Staff Member'}</h3>
                            <button className="close-x" onClick={closeModal}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="staff-form">
                            {error && <div className="error-alert">{error}</div>}

                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                            </div>

                            {modalMode === 'add' && (
                                <div className="form-group">
                                    <label>Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange}>
                                        <option value="mechanic">Mechanic</option>
                                        <option value="receptionist">Receptionist</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Password {modalMode === 'edit' && <span className="hint">(Leave blank to keep current)</span>}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={modalMode === 'add'}
                                    minLength={6}
                                />
                            </div>

                            <div className="modal-footer-sup">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    {modalMode === 'add' ? 'Create Staff' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
