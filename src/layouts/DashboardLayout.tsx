import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Dashboard from '../pages/Dashboard';
import Websites from '../pages/Websites';
import WpManager from '../pages/WpManager';
import Invoices from '../pages/Invoices';
import Clients from '../pages/Clients';
import ClientEdit from '../pages/ClientEdit';
import Users from '../pages/Users';
import UserEdit from '../pages/UserEdit';
import Packages from '../pages/Packages';
import PackageEdit from '../pages/PackageEdit';
import InvoiceTemplate from '../pages/InvoiceTemplate';
import Registrations from '../pages/Registrations';
import SiteSettings from '../pages/SiteSettings';
import WhatsAppCTA from '../components/WhatsAppCTA';
import { User } from '../data/mockData';
import Header from '../components/Header';
import { PublicDataProvider } from '../contexts/PublicDataContext';

const DashboardLayout: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('user'));
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    });
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    const handleLogout = () => {
        const userRole = currentUser?.role;
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('user');
        // Redirect to the appropriate login page after logout
        if (userRole === 'client') {
            navigate('/login/client');
        } else {
            navigate('/login/admin');
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        
        // Authentication check effect
        if (!localStorage.getItem('user')) {
             setIsAuthenticated(false);
             // Redirect to a default login page if not authenticated
             navigate('/login/client');
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [navigate]);

    if (!isAuthenticated || !currentUser) {
        // This will be caught by the useEffect, but as a fallback:
        return <Navigate to="/login/client" replace />;
    }

    return (
        <PublicDataProvider>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <Sidebar isOpen={isSidebarOpen} user={currentUser} onLogout={handleLogout} />
                <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} user={currentUser} onLogout={handleLogout} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <Routes>
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard user={currentUser} />} />
                        <Route path="websites" element={<Websites user={currentUser} />} />
                        <Route path="wp-manager" element={<WpManager user={currentUser} />} />
                        <Route path="invoices" element={<Invoices user={currentUser} />} />
                        
                        {['superadmin', 'admin'].includes(currentUser.role) && (
                            <>
                                <Route path="registrations" element={<Registrations />} />
                                <Route path="clients" element={<Clients />} />
                                <Route path="clients/edit/:clientId" element={<ClientEdit />} />
                                <Route path="packages" element={<Packages />} />
                                <Route path="packages/edit/:packageId" element={<PackageEdit />} />
                            </>
                        )}

                        {currentUser.role === 'superadmin' && (
                            <>
                                <Route path="users" element={<Users />} />
                                <Route path="users/edit/:userId" element={<UserEdit />} />
                                <Route path="invoice-template" element={<InvoiceTemplate />} />
                                <Route path="site-settings" element={<SiteSettings />} />
                            </>
                        )}
                        
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </main>
                <WhatsAppCTA />
            </div>
        </div>
    </PublicDataProvider>
    );
};

export default DashboardLayout;