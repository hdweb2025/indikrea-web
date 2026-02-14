import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Client } from '../data/mockData';
import { fetchDashboardData } from '../utils/api';

// FIX: mockUsers is no longer exported, so it's defined locally.
// There is no API endpoint to fetch all users yet.
const mockUsersData: User[] = [
    // Admins with specific roles
    { id: 1, username: 'superadmin', name: 'Indikrea Admin', email: 'admin@indikrea.id', role: 'superadmin', status: 'Active' },
    { id: 2, username: 'rois', name: 'Rois Syarif', email: 'rois.syarif@indikrea.id', role: 'admin', status: 'Active' },
    { id: 3, username: 'hilmy', name: 'Hilmy', email: 'hilmy.support@indikrea.id', role: 'support', status: 'Active' },
    
    // Client users
    { id: 4, username: 'knti', name: 'Sekretariat KNTI', email: 'sekretariat@knti.or.id', role: 'client', status: 'Active', clientId: 1 },
    { id: 5, username: 'digid', name: 'Admin Digid', email: 'admin@digid.id', role: 'client', status: 'Active', clientId: 2 },
    { id: 6, username: 'mawi', name: 'Kepala Mawi', email: 'contact@mtswikebarongan.sch.id', role: 'client', status: 'Active', clientId: 3 },
    { id: 7, username: 'scientium', name: 'Redaksi Scientium', email: 'redaksi@scientium.co.id', role: 'client', status: 'Inactive', clientId: 4 },
];

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>(mockUsersData);
    // FIX: fetch clients from API instead of using mock data
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setClients(data.clients);
                if (Array.isArray(data.users) && data.users.length > 0) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error("Failed to fetch clients data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getRoleClass = (role: User['role']) => {
        const roles: Record<User['role'], string> = {
            superadmin: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
            admin: 'bg-primary-200 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
            support: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            client: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
        };
        return roles[role] || roles.client;
    };

    const getStatusClass = (status: User['status']) => {
        return status === 'Active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Users...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">User Management</h1>
                <Link to="/panel/users/edit/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                   <i className="fas fa-plus mr-2"></i> Add New User
                </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Name</th>
                            <th className="p-4 font-semibold">Username</th>
                            <th className="p-4 font-semibold text-center">Role</th>
                            <th className="p-4 font-semibold">Associated Client</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4">
                                    <div className="font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300 font-mono">{user.username}</td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getRoleClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    {user.clientId ? clients.find(c => c.id === user.clientId)?.name : 'N/A'}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center space-x-2">
                                     <Link 
                                        to={`/panel/users/edit/${user.id}`} 
                                        className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-xs font-semibold rounded-md hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 transition-colors" 
                                        title="Edit User"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </Link>
                                    <button
                                        onClick={() => alert(`Simulating deletion of user: ${user.name}`)}
                                        className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-xs font-semibold rounded-md hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-colors"
                                        title="Delete User"
                                    >
                                       <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
