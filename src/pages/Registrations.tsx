import React, { useState, useEffect } from 'react';
import { Registration, HostingPackage } from '../data/mockData';
import { fetchDashboardData } from '../utils/api';

const Registrations: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    // FIX: fetch packages from API instead of using mock data
    const [packages, setPackages] = useState<HostingPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setPackages(data.hostingPackages);
                setRegistrations(data.registrations || []);
            } catch (error) {
                console.error("Failed to fetch registrations data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleStatusChange = (id: number, newStatus: Registration['status']) => {
        setRegistrations(prev =>
            prev.map(reg => (reg.id === id ? { ...reg, status: newStatus } : reg))
        );
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this registration record?')) {
            setRegistrations(prev => prev.filter(reg => reg.id !== id));
        }
    };
    
    const getStatusClass = (status: Registration['status']) => {
        const styles: Record<Registration['status'], string> = {
            'Pending Review': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
            'Contacted': 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'Converted': 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300',
            'Rejected': 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
        return styles[status];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Registrations...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">New Registrations</h1>
                <p className="text-gray-500 dark:text-gray-400">Review and manage new client sign-ups.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Contact Info</th>
                            <th className="p-4 font-semibold">Desired Domain</th>
                            <th className="p-4 font-semibold">Package</th>
                            <th className="p-4 font-semibold">Registration Date</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length > 0 ? registrations.map(reg => {
                            const pkg = packages.find(p => p.id === reg.packageId);
                            return (
                                <tr key={reg.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{reg.fullName}</div>
                                        <div className="text-sm text-gray-500">{reg.email}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300 font-mono">{reg.desiredDomain}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{pkg?.name || 'N/A'}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(reg.registrationDate).toLocaleString()}</td>
                                    <td className="p-4">
                                        <select 
                                            value={reg.status}
                                            onChange={(e) => handleStatusChange(reg.id, e.target.value as Registration['status'])}
                                            className={`w-full p-1.5 text-xs font-semibold rounded-md border-transparent focus:ring-2 focus:ring-primary-500 ${getStatusClass(reg.status)}`}
                                        >
                                            <option value="Pending Review">Pending Review</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Converted">Converted</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </td>
                                    <td className="p-4 text-center space-x-2">
                                        <a href={`mailto:${reg.email}`} className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600" title="Contact User">
                                            <i className="fas fa-envelope"></i>
                                        </a>
                                        <button onClick={() => handleDelete(reg.id)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600" title="Delete Registration">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-gray-500">
                                    <i className="fas fa-user-check text-5xl mb-4"></i>
                                    <h3 className="text-xl font-semibold">All Caught Up!</h3>
                                    <p>There are no new registrations to review.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Registrations;
