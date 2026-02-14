import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublicData } from '../contexts/PublicDataContext';
import { API_BASE_URL } from '../utils/api';

interface LoginProps {
    userType: 'Admin' | 'Client';
}

const backgroundOptions = [
    { id: 'default', name: 'Default', class: 'bg-gray-100 dark:bg-gray-900' },
    { id: 'aurora', name: 'Aurora', class: 'bg-aurora' },
    { id: 'galaxy', name: 'Galaxy', class: 'bg-galaxy' },
    { id: 'grid', name: 'Grid', class: 'bg-grid' },
];


const Login: React.FC<LoginProps> = ({ userType }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgClass, setBgClass] = useState(backgroundOptions[0].class);
    const { settings } = usePublicData();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (username.trim() === '' || password.trim() === '') {
            setError('Silakan masukkan username dan password.');
            return;
        }
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const isAdminLogin = userType === 'Admin';
                const isUserAdmin = ['superadmin', 'admin', 'support'].includes(data.user.role);
                const isUserClient = data.user.role === 'client';

                if ((isAdminLogin && isUserAdmin) || (!isAdminLogin && isUserClient)) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    navigate('/panel/dashboard');
                } else {
                    setError('Kredensial tidak sesuai untuk portal ini.');
                }
            } else {
                setError(data.message || 'Terjadi kesalahan tak terduga.');
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server. Silakan coba lagi nanti.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
        <div className={`flex min-h-screen transition-colors duration-500 ${bgClass}`}>
            {/* Background Switcher Sidebar */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 bg-white/30 dark:bg-black/30 backdrop-blur-sm p-2 rounded-r-lg space-y-2 z-10">
                {backgroundOptions.map(opt => (
                     <button 
                        key={opt.id} 
                        onClick={() => setBgClass(opt.class)}
                        title={opt.name}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${bgClass === opt.class ? 'border-primary-500 scale-110' : 'border-transparent'}`}
                    >
                         <div className={`w-full h-full rounded-full ${opt.class}`}></div>
                     </button>
                ))}
            </div>

            {/* Login Form */}
            <div className="flex items-center justify-center w-full">
                <div className="w-full max-w-md p-8 space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl m-4">
                    <div className="text-center">
                        <Link to="/" className="inline-block mb-4">
                            <img src={((settings?.company?.companyLogo && settings.company.companyLogo !== '/icon.png') ? settings.company.companyLogo : '/indikrea_hosting.webp')} alt={`${(settings?.general?.siteName || 'Indikrea')} Logo`} className="h-16 w-auto mx-auto" />
                            <h1 className="text-2xl font-bold mt-2 text-gray-800 dark:text-white">{settings?.general?.siteName || 'Indikrea'}</h1>
                        </Link>
                        <p className="text-gray-500 dark:text-gray-400">{userType} Portal Login</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <div className="mt-1 relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <i className="fas fa-user text-gray-400"></i>
                                </span>
                                <input id="username" name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
                                    autoComplete="off"
                                    placeholder="Your Username"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                                </label>
                                <Link to="/login/reset-password" className="text-xs text-primary-600 hover:text-primary-500">Forgot Password?</Link>
                            </div>
                            <div className="mt-1 relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <i className="fas fa-lock text-gray-400"></i>
                                </span>
                                <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                    autoComplete="current-password"
                                    placeholder="Your Password"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                        <div>
                            <button type="submit" disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:bg-primary-400 disabled:cursor-not-allowed">
                                {isLoading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Signing in...</> : 'Sign in'}
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        { userType === 'Client' 
                            ? <>Not an Admin? <Link to="/login/admin" className="font-medium text-primary-600 hover:text-primary-500">Admin Login</Link></>
                            : <>Not a Client? <Link to="/login/client" className="font-medium text-primary-600 hover:text-primary-500">Client Login</Link></>
                        }
                    </p>
                </div>
            </div>
        </div>
        <style>{`
            .bg-aurora { background: radial-gradient(ellipse at top, #134e4a, #111827), radial-gradient(ellipse at bottom, #0d9488, #111827); }
            .bg-galaxy { background-image: radial-gradient(at 47% 33%, hsl(209.00, 25%, 20%) 0, transparent 59%), radial-gradient(at 82% 65%, hsl(218.00, 39%, 25%) 0, transparent 55%); background-color: #111827; }
            .bg-grid { background-color: #111827; background-image: linear-gradient(#0f766e 1px, transparent 1px), linear-gradient(to right, #0f766e 1px, #111827 1px); background-size: 30px 30px; }
        `}</style>
        </>
    );
};

export default Login;
