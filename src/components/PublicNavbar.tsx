import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePublicData } from '../contexts/PublicDataContext';
import { useTheme } from '../contexts/ThemeContext';

const PublicNavbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { settings, loading } = usePublicData();

    const navLinkClass = "text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors";
    
    const renderLink = (text: string, url: string) => {
        const isInternalRoute = url.startsWith('/') && !url.includes('.');
        
        if (isInternalRoute) {
            return <NavLink to={url} className={({isActive}) => `${navLinkClass} ${isActive ? 'text-primary-500 font-semibold' : ''}`}>{text}</NavLink>;
        }

        return <a href={url} target="_blank" rel="noopener noreferrer" className={navLinkClass}>{text}</a>;
    };

    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                     <NavLink to="/" className="flex items-center">
                        {loading ? (
                            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ) : (
                            <img src={((settings?.company?.companyLogo && settings.company.companyLogo !== '/icon.png') ? settings.company.companyLogo : '/indikrea_hosting.webp')} alt={`${(settings?.general?.siteName || 'Indikrea')} Logo`} className="h-8 w-auto" />
                        )}
                        <span className="ml-3 text-2xl font-bold">{loading ? 'Loading...' : (settings?.general?.siteName || 'Indikrea')}</span>
                    </NavLink>
                    <nav className="hidden md:flex items-center space-x-8">
                        {(settings?.navigation?.headerLinks || []).map(link => (
                            <React.Fragment key={link.url}>
                                {renderLink(link.text, link.url)}
                            </React.Fragment>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={toggleTheme} 
                            className="text-gray-500 dark:text-gray-400 focus:outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
                            aria-label="Toggle dark mode"
                        >
                            {theme === 'dark' ? (
                                <i className="fas fa-sun text-xl text-yellow-400 transition-transform duration-500 rotate-0"></i>
                            ) : (
                                <i className="fas fa-moon text-xl text-gray-600 transition-transform duration-500 rotate-0"></i>
                            )}
                        </button>
                         <NavLink to="/login/admin" className="hidden md:inline-block px-4 py-2 text-sm border border-primary-500 text-primary-500 rounded-md hover:bg-primary-500 hover:text-white transition-colors">
                            Admin Login
                        </NavLink>
                         <button className="md:hidden text-gray-500 dark:text-gray-400">
                            <i className="fas fa-bars text-xl"></i>
                         </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PublicNavbar;
