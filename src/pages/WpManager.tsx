import React, { useState, useMemo, useEffect } from 'react';
import { User, Website } from '../data/mockData';
import { fetchDashboardData } from '../utils/api';

interface WpManagerProps {
    user: User;
}

const WpManager: React.FC<WpManagerProps> = ({ user }) => {
    const [filter, setFilter] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
    // FIX: fetch websites from API instead of using mock data
    const [allWebsites, setAllWebsites] = useState<Website[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setAllWebsites(data.websites);
            } catch (error) {
                console.error("Failed to fetch websites data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const wpSites = useMemo(() => {
        const sites = ['superadmin', 'admin', 'support'].includes(user.role)
            ? allWebsites.filter(w => w.wp_url)
            : allWebsites.filter(w => w.client_id === user.clientId && w.wp_url);

        return sites.filter(site => 
            site.domain_name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [user, filter, allWebsites]);

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Add a toast notification here in a real app
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading WP Vault...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">WordPress Vault</h1>
                 <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Filter by domain..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Domain</th>
                            <th className="p-4 font-semibold">WP-Admin URL</th>
                            <th className="p-4 font-semibold">Username</th>
                            {['superadmin'].includes(user.role) && <th className="p-4 font-semibold">Password</th>}
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wpSites.map(site => (
                            <tr key={site.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-medium text-primary-600 dark:text-primary-400">{site.domain_name}</td>
                                <td className="p-4">
                                    <a href={site.wp_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {site.wp_url}
                                    </a>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{site.wp_user}</td>
                                {['superadmin'].includes(user.role) && (
                                    <td className="p-4 font-mono">
                                        {visiblePasswords[site.id] ? site.wp_pass_encrypted : '••••••••••••'}
                                    </td>
                                )}
                                <td className="p-4 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        {['superadmin'].includes(user.role) && (
                                            <>
                                                <button onClick={() => togglePasswordVisibility(site.id)} className="text-gray-500 hover:text-primary-500" title={visiblePasswords[site.id] ? "Hide" : "Show"}>
                                                    <i className={`fas ${visiblePasswords[site.id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                                <button onClick={() => copyToClipboard(site.wp_pass_encrypted || '')} className="text-gray-500 hover:text-primary-500" title="Copy">
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                            </>
                                        )}
                                        <button className="text-gray-500 hover:text-primary-500" title="Edit (mock)">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {wpSites.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fab fa-wordpress-simple text-4xl mb-3"></i>
                        <p>No WordPress sites found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WpManager;
