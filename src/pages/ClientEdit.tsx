import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '../data/mockData';
import { fetchDashboardData, updateClient } from '../utils/api';

const ClientEdit: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const isNewClient = clientId === 'new';

    const [client, setClient] = useState<Partial<Client>>({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        company_reg_no: '',
        status: 'Active',
        join_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(!isNewClient);


    useEffect(() => {
        if (!isNewClient && clientId) {
            const loadClient = async () => {
                setLoading(true);
                try {
                    const { clients } = await fetchDashboardData();
                    const existingClient = clients.find(c => c.id === parseInt(clientId));
                    if (existingClient) {
                        setClient(existingClient);
                    } else {
                        navigate('/panel/clients'); // Client not found, redirect
                    }
                } catch (error) {
                    console.error("Failed to fetch client data", error);
                    navigate('/panel/clients');
                } finally {
                    setLoading(false);
                }
            };
            loadClient();
        }
    }, [clientId, isNewClient, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClient(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: Partial<Client> = {
                id: isNewClient ? undefined : parseInt(clientId || '0'),
                name: client.name || '',
                contact_person: client.contact_person || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                company_reg_no: client.company_reg_no || '',
                join_date: client.join_date || new Date().toISOString().split('T')[0],
                status: client.status || 'Active'
            };
            const res = await updateClient(payload);
            alert(`Client data for "${payload.name}" has been saved.`);
            navigate('/panel/clients');
        } catch (err: any) {
            alert(err?.message || 'Failed to save client.');
            console.error('Save client failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Client Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
                 <button onClick={() => navigate('/panel/clients')} className="text-gray-500 hover:text-primary-500" title="Back to Clients">
                    <i className="fas fa-arrow-left text-2xl"></i>
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {isNewClient ? 'Add New Client' : 'Edit Client'}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="border-b dark:border-gray-700 pb-4">
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
                                <input type="text" name="name" id="name" value={client.name} onChange={handleChange} required className="mt-1 w-full form-input" />
                            </div>
                            <div>
                                <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                                <input type="text" name="contact_person" id="contact_person" value={client.contact_person} onChange={handleChange} required className="mt-1 w-full form-input" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <input type="email" name="email" id="email" value={client.email} onChange={handleChange} required className="mt-1 w-full form-input" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                <input type="tel" name="phone" id="phone" value={client.phone} onChange={handleChange} required className="mt-1 w-full form-input" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                <textarea name="address" id="address" value={client.address} onChange={handleChange} rows={3} className="mt-1 w-full form-input"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Business & Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="company_reg_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Reg. No (Optional)</label>
                                <input type="text" name="company_reg_no" id="company_reg_no" value={client.company_reg_no} onChange={handleChange} className="mt-1 w-full form-input" />
                            </div>
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client Status</label>
                                <select name="status" id="status" value={client.status} onChange={handleChange} className="mt-1 w-full form-input">
                                    <option>Active</option>
                                    <option>Inactive</option>
                                    <option>Suspended</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="join_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Join Date</label>
                                <input type="date" name="join_date" id="join_date" value={client.join_date} onChange={handleChange} required className="mt-1 w-full form-input" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => navigate('/panel/clients')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Save Client
                        </button>
                    </div>
                </form>
            </div>
             <style>{`
                .form-input {
                    display: block;
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    border: 1px solid;
                    border-radius: 0.5rem;
                    transition: all 0.15s ease-in-out;
                }

                .dark .form-input {
                    background-color: #374151;
                    border-color: #4b5563;
                    color: #d1d5db;
                }

                .form-input {
                    background-color: #fff;
                    border-color: #d1d5db;
                    color: #111827;
                }

                .form-input:focus {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    border-color: #06b6d4;
                    box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
};

export default ClientEdit;
