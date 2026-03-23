import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, DollarSign, FileText, Activity, Users, Layers, CheckCircle, LogOut, List } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Layout = ({ user, onLogout }) => {
    const location = useLocation();
    const { settings } = useSettings();
    const [pageTitle, setPageTitle] = useState('Dashboard');

    // Removed Dark Mode Logic

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home, allowedRoles: ['Admin', 'Director', 'Manager', 'Empleado', 'Cajero'] },
        { path: '/transactions', label: 'Transacciones', icon: List, allowedRoles: ['Admin', 'Director', 'Manager', 'Empleado', 'Cajero'] },
        { path: '/expenses/new', label: 'Nuevo Gasto', icon: PlusCircle, allowedRoles: ['Admin', 'Director', 'Manager', 'Empleado', 'Cajero'] },
        { path: '/advances/request', label: 'Pedir Anticipo', icon: DollarSign, allowedRoles: ['Admin', 'Director', 'Manager', 'Empleado', 'Cajero'] },
        { path: '/approvals', label: 'Aprobaciones', icon: CheckCircle, allowedRoles: ['Admin', 'Manager', 'Director', 'Gerente', 'Cajero'] },
        // Admin Section
        { path: '/admin/users', label: 'Usuarios', icon: Users, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/admin/roles', label: 'Roles', icon: Users, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/admin/catalogs', label: 'Catálogos', icon: Layers, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/admin/settings', label: 'Configuración', icon: FileText, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/admin/logs', label: 'Auditoría', icon: Activity, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        // Finance Section
        { path: '/finance/dashboard', label: 'Dashboard Financiero', icon: Activity, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/finance/reconciliation', label: 'Arqueo de Caja', icon: DollarSign, allowedRoles: ['Admin', 'Director', 'Cajero'] },
        { path: '/finance/replenish', label: 'Ingreso de Fondos', icon: PlusCircle, allowedRoles: ['Admin', 'Director', 'Cajero'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
    );

    // Dynamic API URL base if needed, or relative path
    // The logo_url comes from backend as /uploads/filename using express.static
    // We need to prepend API_URL if it's not relative to frontend server (which it isn't if proxy is not set for uploads)
    // Assuming backend is at localhost:3000, and frontend uses Vite proxy or absolute URL
    // If we rely on proxy in vite.config, /uploads works.
    // Let's assume vite config proxies /uploads to backend.

    // Fallback logo if null
    const logoSrc = settings.logo_url ? `http://localhost:3000${settings.logo_url}` : null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Fixed Sidebar */}
            <aside className="bg-sidebar-bg text-sidebar-text w-64 fixed h-full flex flex-col z-20 transition-colors duration-300">
                <div className="p-4 font-bold text-xl tracking-wide border-b border-sidebar-hover flex flex-col justify-center items-center h-auto min-h-[4rem] gap-2">
                    {logoSrc && (
                        <img src={logoSrc} alt="Logo" className="h-12 w-auto object-contain" />
                    )}
                    <span className="text-center">{settings.app_name || 'Induwell Cloud'}</span>
                </div>

                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-sidebar-active text-sidebar-text' : 'text-sidebar-text opacity-70 hover:opacity-100 hover:bg-sidebar-hover'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-64 min-w-0">
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
                    {/* Page Title injected here */}
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-secondary">{pageTitle}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-800">{user?.name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500">{user?.role || 'Rol'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={20} />
                            <span className="text-sm font-medium hidden md:inline">Salir</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
                    <Outlet context={{ setPageTitle }} />
                </main>
            </div>
        </div>
    );
};

export default Layout;
