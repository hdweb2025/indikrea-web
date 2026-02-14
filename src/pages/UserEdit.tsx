import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Client } from '../data/mockData';
import { fetchDashboardData, updateUser } from '../utils/api';

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

const UserEdit: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const isNewUser = userId === 'new';

    const [currentUser] = useState<User | null>(() => {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) as User : null;
    });

    const [user, setUser] = useState<Partial<User>>({
        name: '',
        username: '',
        email: '',
        role: 'client',
        status: 'Active',
        clientId: undefined
    });

    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const [userType, setUserType] = useState<'administrator' | 'client'>('client');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setClients(data.clients);
                
                if (!isNewUser && userId) {
                    const uid = parseInt(userId);
                    const apiUsers = Array.isArray((data as any).users) ? (data as any).users as User[] : [];
                    const existingUser = apiUsers.find(u => u.id === uid);
                    
                    if (existingUser) {
                        setUser(existingUser);
                        setUserType(['superadmin', 'admin', 'support'].includes(existingUser.role) ? 'administrator' : 'client');
                    } else if (currentUser && currentUser.id === uid) {
                        setUser(currentUser);
                        setUserType(['superadmin', 'admin', 'support'].includes(currentUser.role) ? 'administrator' : 'client');
                    } else {
                        navigate('/panel/users');
                    }
                }
            } catch (error) {
                console.error("Failed to load data for user edit:", error);
                navigate('/panel/users');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId, isNewUser, navigate, currentUser]);
    
    // Superadmin can edit other users' credentials, but not their own on this page.
    const canEditCredentials = currentUser?.role === 'superadmin' && user.id !== undefined && currentUser.id !== user.id;


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleUserTypeChange = (type: 'administrator' | 'client') => {
        setUserType(type);
        if (type === 'administrator') {
            setUser(prev => ({ ...prev, role: 'support', clientId: undefined }));
        } else {
            setUser(prev => ({ ...prev, role: 'client', clientId: clients[0]?.id }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((isNewUser || (canEditCredentials && password)) && password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        try {
            const payload: Partial<User> = { id: user.id!, name: user.name || '', email: user.email || '' };
            if (canEditCredentials) {
                payload.role = user.role;
                payload.clientId = user.clientId;
                payload.status = user.status;
            }
            await updateUser(payload);
            alert(`User data for "${user.name}" has been saved.`);
            navigate('/panel/users');
        } catch (err: any) {
            alert(err?.message || 'Failed to save user.');
        }
    };

    const formStyle = `
        .form-input {
            display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem;
            border: 1px solid #d1d5db; border-radius: 0.5rem; transition: all 0.15s ease-in-out;
            background-color: #fff; color: #111827;
        }
        .dark .form-input { background-color: #374151; border-color: #4b5563; color: #d1d5db; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.5); }
        .form-input[readOnly] { background-color: #f3f4f6; cursor: not-allowed; }
        .dark .form-input[readOnly] { background-color: #4b5563; }
    `;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading User Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
                 <button onClick={() => navigate('/panel/users')} className="text-gray-500 hover:text-primary-500" title="Back to Users">
                    <i className="fas fa-arrow-left text-2xl"></i>
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {isNewUser ? 'Add New User' : `Edit User: ${user.name}`}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Type Selection (Only for new users) */}
                    {isNewUser && (
                        <div className="border-b dark:border-gray-700 pb-4">
                            <h2 className="text-xl font-semibold mb-4">User Type</h2>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => handleUserTypeChange('administrator')} className={`px-4 py-2 rounded-lg flex-1 ${userType === 'administrator' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Administrator</button>
                                <button type="button" onClick={() => handleUserTypeChange('client')} className={`px-4 py-2 rounded-lg flex-1 ${userType === 'client' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Client</button>
                            </div>
                        </div>
                    )}


                    {/* User Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
                            <input type="text" name="name" id="name" value={user.name} onChange={handleChange} required className="mt-1 form-input" />
                        </div>
                         <div>
                            <label htmlFor="username" className="block text-sm font-medium">Username</label>
                            <input 
                                type="text" name="username" id="username" value={user.username} 
                                onChange={handleChange} required 
                                readOnly={!isNewUser && !canEditCredentials}
                                className="mt-1 form-input" 
                                title={!isNewUser && !canEditCredentials ? "Username cannot be changed." : ""}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                            <input type="email" name="email" id="email" value={user.email} onChange={handleChange} required className="mt-1 form-input" />
                        </div>
                    </div>

                    {/* Role & Client Association */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {userType === 'administrator' ? (
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium">Role</label>
                                <select name="role" id="role" value={user.role} onChange={handleChange} className="mt-1 form-input" disabled={!canEditCredentials && !isNewUser}>
                                    <option value="admin">Admin</option>
                                    <option value="support">Support</option>
                                    {/* Superadmin role cannot be assigned from here */}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="clientId" className="block text-sm font-medium">Associate with Client</label>
                                <select name="clientId" id="clientId" value={user.clientId || ''} onChange={handleChange} required className="mt-1 form-input">
                                    <option value="" disabled>Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium">Status</label>
                            <select name="status" id="status" value={user.status} onChange={handleChange} className="mt-1 form-input">
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Password Section */}
                    {(isNewUser || canEditCredentials) && (
                        <div className="border-t dark:border-gray-700 pt-6">
                            <h2 className="text-xl font-semibold mb-4">{isNewUser ? 'Set Password' : 'Change Password'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="password">New Password</label>
                                    <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required={isNewUser} className="mt-1 form-input" />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required={isNewUser} className="mt-1 form-input" />
                                </div>
                            </div>
                            {!isNewUser && <p className="text-xs text-gray-500 mt-2">Leave blank to keep the current password.</p>}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => navigate('/panel/users')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Save User
                        </button>
                    </div>
                </form>
            </div>
            <style>{formStyle}</style>
        </div>
    );
};

export default UserEdit;
