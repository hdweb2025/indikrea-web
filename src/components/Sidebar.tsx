import React from 'react';
import { NavLink } from 'react-router-dom';
import { User } from '../data/mockData';
import { usePublicData } from '../contexts/PublicDataContext';

interface SidebarProps {
    isOpen: boolean;
    user: User;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user, onLogout }) => {
    const { settings } = usePublicData();
    const navLinkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200";
    const activeLinkClasses = "bg-primary-600 text-white";

    return (
        <aside className={`bg-gray-800 text-white ${isOpen ? 'w-64' : 'w-0'} md:w-64 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-20 border-b border-gray-700">
                    <img src={((settings?.company?.companyLogo && settings.company.companyLogo !== '/icon.png') ? settings.company.companyLogo : '/indikrea_hosting.webp')} alt={`${(settings?.general?.siteName || 'Indikrea')} Logo`} className="h-9 w-auto" />
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavLink to="/panel/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <i className="fas fa-tachometer-alt fa-fw mr-3"></i>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/panel/websites" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <i className="fas fa-globe fa-fw mr-3"></i>
                        <span>Websites</span>
                    </NavLink>
                    <NavLink to="/panel/wp-manager" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <i className="fab fa-wordpress fa-fw mr-3"></i>
                        <span>WP Manager</span>
                    </NavLink>
                    <NavLink to="/panel/invoices" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <i className="fas fa-file-invoice-dollar fa-fw mr-3"></i>
                        <span>Invoices</span>
                    </NavLink>

                    {['superadmin', 'admin'].includes(user.role) && (
                        <>
                             <NavLink to="/panel/registrations" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-user-plus fa-fw mr-3"></i>
                                <span>Registrations</span>
                            </NavLink>
                            <NavLink to="/panel/clients" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-users fa-fw mr-3"></i>
                                <span>Clients</span>
                            </NavLink>
                            <NavLink to="/panel/packages" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-box-open fa-fw mr-3"></i>
                                <span>Hosting Packages</span>
                            </NavLink>
                        </>
                    )}

                    {user.role === 'superadmin' && (
                        <>
                            <NavLink to="/panel/users" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-users-cog fa-fw mr-3"></i>
                                <span>Users</span>
                            </NavLink>
                             <NavLink to="/panel/site-settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-palette fa-fw mr-3"></i>
                                <span>Site Settings</span>
                            </NavLink>
                            <NavLink to="/panel/invoice-template" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                                <i className="fas fa-file-invoice fa-fw mr-3"></i>
                                <span>Invoice Template</span>
                            </NavLink>
                        </>
                    )}
                </nav>
                <div className="px-4 py-4 border-t border-gray-700">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center justify-center mt-4 px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors duration-200">
                        <i className="fas fa-sign-out-alt fa-fw mr-2"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
