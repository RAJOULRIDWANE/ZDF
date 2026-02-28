import React, { useState } from 'react';
import './SupervisorSidebar.css';

const navItems = [
    {
        id: 'analytics',
        label: 'Analytics',
        icon: 'ri-bar-chart-2-line',
    },
    {
        id: 'user-management',
        label: 'User Management',
        icon: 'ri-team-line',
    },
    {
        id: 'parts',
        label: 'Parts',
        icon: 'ri-tools-line',
    },
    {
        id: 'appointments',
        label: 'Appointments',
        icon: 'ri-calendar-check-line',
    },
    {
        id: 'repairs',
        label: 'Repairs',
        icon: 'ri-car-line',
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: 'ri-file-chart-line',
    },
];

const SupervisorSidebar = ({ activeSection, onSectionChange }) => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`supervisor-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo / Brand area */}
            <div className="sidebar-brand">
                {!collapsed && <span className="sidebar-brand-text">Supervisor</span>}
                <button
                    className="sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <i className={`ri-arrow-${collapsed ? 'right' : 'left'}-s-line`}></i>
                </button>
            </div>

            {/* Navigation items */}
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => onSectionChange(item.id)}
                        title={collapsed ? item.label : ''}
                    >
                        <i className={`${item.icon} sidebar-icon`}></i>
                        {!collapsed && <span className="sidebar-label">{item.label}</span>}
                        {activeSection === item.id && <span className="active-indicator" />}
                    </button>
                ))}
            </nav>

            {/* Bottom section label */}
            {!collapsed && (
                <div className="sidebar-footer">
                    <span className="sidebar-version">v2.0</span>
                </div>
            )}
        </aside>
    );
};

export default SupervisorSidebar;
