import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Client } from '../data/mockData';
import { fetchDashboardData, createInvoiceForClient, deleteClientById } from '../utils/api';

const Clients: React.FC = () => {
    // FIX: fetch clients from API instead of using mock data
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setClients(data.clients);
            } catch (error) {
                console.error("Failed to fetch clients data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const reloadClients = async () => {
        setLoading(true);
        try {
            const data = await fetchDashboardData();
            setClients(data.clients);
        } catch (error) {
            console.error("Failed to reload clients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (clientId: number, clientName: string) => {
        if (!window.confirm(`Buat invoice baru untuk client "${clientName}"?`)) return;
        try {
            const res = await createInvoiceForClient(clientId);
            alert(`Invoice baru berhasil dibuat${res?.invoice_number ? `: ${res.invoice_number}` : ''}.`);
        } catch (err: any) {
            alert(err?.message || 'Gagal membuat invoice baru.');
        }
    };

    const handleDeleteClient = async (clientId: number, clientName: string) => {
        const ok = window.confirm(`Hapus client "${clientName}" beserta website, invoice, dan user terkait?`);
        if (ok !== true) return;
        try {
            await deleteClientById(clientId);
            setClients(prev => prev.filter(c => c.id !== clientId));
            alert('Client berhasil dihapus.');
        } catch (err: any) {
            alert(err?.message || 'Gagal menghapus client.');
        }
    };

    const getStatusClass = (status: Client['status']) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Inactive':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
            case 'Suspended':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Clients...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Client Management</h1>
                <Link to="/panel/clients/edit/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                   <i className="fas fa-plus mr-2"></i> Add New Client
                </Link>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Client Name</th>
                            <th className="p-4 font-semibold">Contact Person</th>
                            <th className="p-4 font-semibold">Company Reg. No</th>
                            <th className="p-4 font-semibold">Email & Phone</th>
                            <th className="p-4 font-semibold">Join Date</th>
                            <th className="p-4 font-semibold text-center">Status</th>
                            <th className="p-4 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-4 font-medium text-primary-600 dark:text-primary-400">{client.name}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{client.contact_person}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{client.company_reg_no || 'N/A'}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">
                                    <div>{client.email}</div>
                                    <div className="text-sm text-gray-500">{client.phone}</div>
                                </td>
                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                    {new Date(client.join_date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(client.status)}`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="inline-flex items-center gap-2">
                                        <Link 
                                            to={`/panel/clients/edit/${client.id}`} 
                                            className="px-3 py-1 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 text-xs font-semibold rounded-md hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 transition-colors" 
                                            title="Edit Client"
                                        >
                                            <i className="fas fa-edit mr-1"></i> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleCreateInvoice(client.id, client.name)}
                                            className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-md hover:bg-primary-700"
                                            title="Buat Invoice Baru"
                                        >
                                            <i className="fas fa-file-invoice-dollar mr-1"></i> Invoice Baru
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClient(client.id, client.name)}
                                            className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700"
                                            title="Hapus Client"
                                        >
                                            <i className="fas fa-trash-alt mr-1"></i> Hapus
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Clients;
