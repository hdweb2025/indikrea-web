import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { PublicDataProvider } from '../contexts/PublicDataContext';
import WhatsAppCTA from '../components/WhatsAppCTA';

const PublicLayout: React.FC = () => {
    return (
        <PublicDataProvider>
            <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <PublicNavbar />
                <main className="flex-grow">
                    <Outlet />
                </main>
                <PublicFooter />
                <WhatsAppCTA />
            </div>
        </PublicDataProvider>
    );
};

export default PublicLayout;