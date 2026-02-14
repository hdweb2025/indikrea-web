import React, { useMemo, useState, useEffect } from 'react';
import { User, Website, Invoice, Client, HostingPackage } from '../data/mockData';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import ResourceUsageBar from '../components/ResourceUsageBar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchDashboardData } from '../utils/api';

interface DashboardProps {
    user: User;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    const [websites, setWebsites] = useState<Website[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchDashboardData();
                setWebsites(data.websites);
                setInvoices(data.invoices);
                setClients(data.clients);
                setHostingPackages(data.hostingPackages);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                // Optionally set an error state to show a message to the user
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    
    // For clients, find their main website to display package info
    const mainClientWebsite = useMemo(() => {
        if (user.role === 'client') {
            return websites.find(w => !w.parentId && w.client_id === user.clientId) || websites[0];
        }
        return null;
    }, [user, websites]);

    const currentPackage = useMemo(() => {
        if (mainClientWebsite) {
            return hostingPackages.find(p => p.id === mainClientWebsite.package_id);
        }
        return null;
    }, [mainClientWebsite, hostingPackages]);

    const totalDiskUsage = websites.reduce((acc, site) => acc + site.disk_usage_mb, 0);
    const activeDomains = websites.length;
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const unpaidInvoices = invoices.filter(i => {
        const dueDate = new Date(i.due_date);
        return i.status === 'Unpaid' && dueDate <= thirtyDaysFromNow;
    }).length;

    const diskUsageByClient = useMemo(() => {
        if (!['superadmin', 'admin'].includes(user.role)) return [];
        const data = clients.map(client => ({
            name: client.name.split(' ')[0],
            usage: websites
                .filter(w => w.client_id === client.id)
                .reduce((acc, w) => acc + w.disk_usage_mb, 0) / 1024, // in GB
        }));
        return data.filter(d => d.usage > 0).sort((a,b) => b.usage - a.usage);
    }, [user.role, websites, clients]);
    
    const invoiceStatusData = useMemo(() => {
      const paid = invoices.filter(i => i.status === 'Paid').length;
      const unpaid = invoices.length - paid;
      return [
        { name: 'Paid', value: paid },
        { name: 'Unpaid', value: unpaid }
      ]
    }, [invoices]);

    const COLORS = ['#059669', '#DC2626'];

    const handlePackageChange = (newPackageId: number) => {
        if (!mainClientWebsite) return;
        
        setWebsites(prev => prev.map(site => 
            site.id === mainClientWebsite.id ? { ...site, package_id: newPackageId } : site
        ));
        
        setUpgradeModalOpen(false);
        // In a real app, this would be an API call to the backend
        alert(`Package successfully changed to ${hostingPackages.find(p => p.id === newPackageId)?.name}! (Simulation)`);
    };
    
    const usageExceeded = mainClientWebsite && currentPackage && 
        (mainClientWebsite.disk_usage_mb > currentPackage.disk_space_gb * 1024 || mainClientWebsite.inodes > currentPackage.inodes_limit);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
             {usageExceeded && (
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Resource Limit Exceeded</p>
                    <p>Your account has exceeded its allocated resources. Please upgrade your plan to avoid service interruptions.</p>
                </div>
            )}
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard icon="fas fa-hdd" label="Total Disk Usage" value={formatBytes(totalDiskUsage)} color="bg-blue-500" />
                <StatCard icon="fas fa-globe" label="Active Domains" value={activeDomains} color="bg-green-500" />
                <StatCard icon="fas fa-file-invoice-dollar" label="Invoices Due" value={unpaidInvoices} color="bg-red-500" />
            </div>

            {/* Client-specific Package Info */}
            {user.role === 'client' && mainClientWebsite && currentPackage && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                             <h2 className="text-xl font-semibold mb-1">Current Hosting Plan</h2>
                             <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{currentPackage.name}</p>
                        </div>
                        <button onClick={() => setUpgradeModalOpen(true)} className="mt-4 sm:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                            <i className="fas fa-exchange-alt mr-2"></i> Change Plan
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <ResourceUsageBar 
                            label="Disk Usage"
                            current={mainClientWebsite.disk_usage_mb}
                            limit={currentPackage.disk_space_gb * 1024}
                            unit="MB"
                        />
                        <ResourceUsageBar 
                            label="Inodes"
                            current={mainClientWebsite.inodes}
                            limit={currentPackage.inodes_limit}
                            unit=""
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {['superadmin', 'admin'].includes(user.role) && (
                     <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Disk Usage by Client (GB)</h2>
                         <ResponsiveContainer width="100%" height={300}>
                             <BarChart data={diskUsageByClient} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                 <XAxis dataKey="name" tick={{ fill: 'rgb(156 163 175)' }} />
                                 <YAxis tick={{ fill: 'rgb(156 163 175)' }} />
                                 <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}/>
                                 <Legend />
                                 <Bar dataKey="usage" fill="#0ea5e9" name="Disk Usage (GB)" />
                             </BarChart>
                         </ResponsiveContainer>
                     </div>
                )}
                 <div className={`lg:col-span-2 ${!['superadmin', 'admin'].includes(user.role) && 'lg:col-span-5'} bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg`}>
                     <h2 className="text-xl font-semibold mb-4">Invoice Status</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={invoiceStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {invoiceStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} />
                          <Legend />
                        </PieChart>
                     </ResponsiveContainer>
                 </div>
            </div>
             {/* Upgrade/Downgrade Modal */}
             <Modal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} title="Choose Your New Plan">
                 <div className="space-y-4">
                     {hostingPackages.map(pkg => {
                        const isCurrent = pkg.id === currentPackage?.id;
                        const isUpgrade = pkg.monthly_price_idr > (currentPackage?.monthly_price_idr || 0);
                        
                        let canDowngrade = true;
                        let downgradeDisabledReason = '';
                        if (!isUpgrade && !isCurrent && mainClientWebsite) {
                            if (mainClientWebsite.disk_usage_mb > pkg.disk_space_gb * 1024) {
                                canDowngrade = false;
                                downgradeDisabledReason = 'Disk usage exceeds package limit.';
                            } else if (mainClientWebsite.inodes > pkg.inodes_limit) {
                                canDowngrade = false;
                                downgradeDisabledReason = 'Inodes usage exceeds package limit.';
                            }
                        }

                         return (
                             <div key={pkg.id} className={`p-4 rounded-lg border-2 ${isCurrent ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'dark:border-gray-700'}`}>
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <h3 className="font-bold text-lg">{pkg.name} {isCurrent && <span className="text-xs bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full ml-2">Current</span>}</h3>
                                         <p className="font-bold text-xl">{formatCurrency(pkg.monthly_price_idr)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                     </div>
                                     {isCurrent ? (
                                         <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed" disabled>Current Plan</button>
                                     ) : (isUpgrade || canDowngrade) ? (
                                         <button onClick={() => handlePackageChange(pkg.id)} className={`px-4 py-2 text-white rounded-lg ${isUpgrade ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                                             {isUpgrade ? 'Upgrade' : 'Downgrade'}
                                         </button>
                                     ) : (
                                          <div className="text-right">
                                             <button className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed" disabled>Downgrade</button>
                                             <p className="text-xs text-red-500 mt-1">{downgradeDisabledReason}</p>
                                          </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             </Modal>
        </div>
    );
};

export default Dashboard;
