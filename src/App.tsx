import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Register from './pages/Register';
import LoginClient from './pages/LoginClient';
import LoginAdmin from './pages/LoginAdmin';
import PackagesPublic from './pages/PackagesPublic';
import ResetPassword from './pages/ResetPassword';


// Lazy load the DashboardLayout component
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
            <i className="fas fa-spinner fa-spin text-primary-500 text-4xl"></i>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading Dashboard...</p>
        </div>
    </div>
);


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <HashRouter>
                <Routes>
                    {/* Public-facing routes */}
                <Route path="/" element={<PublicLayout />}>
                    <Route index element={<Home />} />
                    <Route path="packages" element={<PackagesPublic />} />
                    <Route path="register/:packageId" element={<Register />} />
                    <Route path="login/client" element={<LoginClient />} />
                    <Route path="login/admin" element={<LoginAdmin />} />
                    <Route path="login/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Authenticated dashboard routes with lazy loading */}
                <Route 
                    path="/panel/*" 
                    element={
                        <Suspense fallback={<LoadingFallback />}>
                            <DashboardLayout />
                        </Suspense>
                    } 
                />
            </Routes>
            </HashRouter>
        </ThemeProvider>
    );
};

export default App;