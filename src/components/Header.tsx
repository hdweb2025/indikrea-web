import React, { useState, useEffect, useRef } from 'react';
import { User } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
    toggleSidebar: () => void;
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, user, onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const displayName = user.name || user.username || 'User';
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (!menuRef.current) return;
            if (menuRef.current.contains(e.target as Node)) return;
            setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isMenuOpen]);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-md h-16 flex-shrink-0 z-10">
            <div className="flex items-center justify-between px-4 sm:px-6 h-full">
                <button onClick={toggleSidebar} className="text-gray-500 dark:text-gray-400 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200">
                    <i className="fas fa-bars text-xl"></i>
                </button>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={toggleTheme} 
                        className="text-gray-500 dark:text-gray-400 focus:outline-none transition-transform duration-300 hover:scale-110 active:scale-95"
                        aria-label="Toggle dark mode"
                    >
                        {theme === 'dark' ? (
                            <i className="fas fa-sun text-xl text-yellow-400"></i>
                        ) : (
                            <i className="fas fa-moon text-xl text-gray-600"></i>
                        )}
                    </button>
                    <div className="hidden md:flex items-center relative" ref={menuRef}>
                        <span className="text-sm font-medium mr-2">{displayName}</span>
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center font-bold text-white text-sm focus:outline-none"
                            aria-label="User menu"
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
                                {user.role === 'superadmin' && (
                                    <button
                                        onClick={() => { setIsMenuOpen(false); navigate(`/panel/users/edit/${user.id}`); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                    >
                                        <i className="fas fa-user-cog mr-2"></i> Edit Profile
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsMenuOpen(false); navigate('/login/reset-password'); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    <i className="fas fa-key mr-2"></i> Reset Password
                                </button>
                                <button
                                    onClick={() => { setIsMenuOpen(false); onLogout(); }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    <i className="fas fa-sign-out-alt mr-2"></i> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
