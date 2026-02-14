import React, { useState, useMemo, useEffect } from 'react';
import { User, Website, HostingPackage } from '../data/mockData';
import ResourceUsageBar from '../components/ResourceUsageBar';
import { fetchDashboardData, API_BASE_URL } from '../utils/api';

interface WebsitesProps {
    user: User;
}

const formatDiskUsage = (mb: number, decimals = 2) => {
    if (mb <= 0) return '0 MiB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['MiB', 'GiB', 'TiB'];

    if (mb < 1) {
        return `${(mb * 1024).toFixed(dm)} KiB`;
    }
    
    const i = Math.floor(Math.log(mb) / Math.log(k));
    return parseFloat((mb / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getExpiryInfo = (expiryDate: string): { isExpiring: boolean; daysLeft: number; isExpired: boolean } | null => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        isExpiring: daysLeft <= 30 && daysLeft >= 0,
        daysLeft,
        isExpired: daysLeft < 0,
    };
};

const DomainCard: React.FC<{ site: Website; hostingPackage?: HostingPackage }> = ({ site, hostingPackage }) => {
    const expiryInfo = getExpiryInfo(site.expiry_date);
    
    const getIndicator = () => {
        if (!expiryInfo) return null;
        if (expiryInfo.isExpired) {
            return {
                borderColor: 'border-red-500',
                icon: 'fas fa-times-circle',
                textColor: 'text-red-500',
                title: `Expired ${Math.abs(expiryInfo.daysLeft)} days ago`
            }
        }
        if (expiryInfo.isExpiring) {
            return {
                borderColor: 'border-yellow-500',
                icon: 'fas fa-exclamation-triangle',
                textColor: 'text-yellow-500',
                title: `Expires in ${expiryInfo.daysLeft} days`
            }
        }
        return null;
    }
    const indicator = getIndicator();

    // Use aggregated data if available, otherwise use own usage
    const displayDisk = site.total_disk_usage_mb !== undefined ? site.total_disk_usage_mb : site.disk_usage_mb;
    const displayInodes = site.total_inodes !== undefined ? site.total_inodes : site.inodes;
    const hasChildren = site.total_disk_usage_mb !== undefined && site.total_disk_usage_mb !== site.disk_usage_mb;

    return (
        <div className={`relative bg-white dark:bg-gray-800 border p-4 rounded-lg flex items-center space-x-4 transition-all hover:shadow-md hover:border-primary-300 dark:hover:border-primary-500 ${indicator ? indicator.borderColor : 'border-gray-200 dark:border-gray-700'}`}>
            {indicator && (
                <div className={`absolute top-2 right-2 ${indicator.textColor}`} title={indicator.title}>
                    <i className={indicator.icon}></i>
                </div>
            )}
             {hostingPackage && (
                 <span className="absolute bottom-2 right-2 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full">{hostingPackage.name}</span>
             )}
            <div className="relative">
                <i className={`fas fa-folder text-5xl ${site.parentId ? 'text-blue-300 dark:text-blue-400' : 'text-blue-400 dark:text-blue-500'}`}></i>
                {hasChildren && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white text-[10px] px-1 rounded-sm" title="Includes subdomain usage">
                        <i className="fas fa-layer-group"></i>
                    </div>
                )}
            </div>
            <div className="overflow-hidden">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-4" title={site.domain_name}>{site.domain_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDiskUsage(displayDisk)} ({displayInodes.toLocaleString()} inodes)
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{site.last_modified}</p>
            </div>
        </div>
    );
};

const GridView: React.FC<{ websites: Website[], packages: HostingPackage[] }> = ({ websites, packages }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {websites.map(site => (
            <DomainCard key={site.id} site={site} hostingPackage={packages.find(p => p.id === site.package_id)} />
        ))}
    </div>
);

interface GroupedWebsite extends Website {
    subdomains: Website[];
}

const ExpiryIndicator: React.FC<{ expiryDate: string }> = ({ expiryDate }) => {
    const expiryInfo = getExpiryInfo(expiryDate);
    if (!expiryInfo) return null;

    if (expiryInfo.isExpired) {
        return (
            <span className="ml-2 text-red-500" title={`Expired ${Math.abs(expiryInfo.daysLeft)} days ago`}>
                <i className="fas fa-times-circle"></i>
            </span>
        );
    }
    if (expiryInfo.isExpiring) {
        return (
            <span className="ml-2 text-yellow-500" title={`Expires in ${expiryInfo.daysLeft} days`}>
                <i className="fas fa-exclamation-triangle"></i>
            </span>
        );
    }
    return null;
}

const ListView: React.FC<{ 
    groupedWebsites: GroupedWebsite[], 
    packages: HostingPackage[],
    editMode: boolean,
    onUpdate: (id: number, data: Partial<Website>) => void
}> = ({ groupedWebsites, packages, editMode, onUpdate }) => {
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
    const [editingData, setEditingData] = useState<Record<number, Partial<Website>>>({});
    const [refreshing, setRefreshing] = useState<Record<number, boolean>>({});
    const [refreshAllBusy, setRefreshAllBusy] = useState(false);

    const toggleRow = (id: number) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };
    
    const handleEditChange = (id: number, field: keyof Website, value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            setEditingData(prev => ({
                ...prev,
                [id]: { ...prev[id], [field]: numValue }
            }));
        }
    };

    const handleSave = (id: number) => {
        if (editingData[id]) {
            onUpdate(id, editingData[id]);
            const newEditingData = { ...editingData };
            delete newEditingData[id];
            setEditingData(newEditingData);
        }
    };
    
    const handleCancel = (id: number) => {
        const newEditingData = { ...editingData };
        delete newEditingData[id];
        setEditingData(newEditingData);
    };

    const refreshWhois = async (id: number, domain: string) => {
        try {
            setRefreshing(prev => ({ ...prev, [id]: true }));
            const res = await fetch(`${API_BASE_URL}/whois.php?domain=${encodeURIComponent(domain)}`);
            const data = await res.json();
            if (res.ok && data.success) {
                const expiryVal = data.expiry || '';
                onUpdate(id, { expiry_date: expiryVal });
                const persist = await fetch(`${API_BASE_URL}/update_whois.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain, expiry: expiryVal, raw: data.raw })
                });
                const saved = await persist.json();
                if (persist.ok && saved.success) {
                    onUpdate(id, { expiry_date: saved.expiry || expiryVal, last_modified: saved.last_updated || 'N/A' });
                } else {
                    console.error("Persist WHOIS failed:", saved.message);
                }
            } else {
                console.error("WHOIS refresh failed:", data.message || "No expiry found");
            }
        } catch (e) {
            console.error("WHOIS refresh error:", e);
        } finally {
            setRefreshing(prev => ({ ...prev, [id]: false }));
        }
    };

    const refreshAllWhois = async () => {
        try {
            setRefreshAllBusy(true);
            const roots = groupedWebsites.filter(g => !g.parentId);
            for (const site of roots) {
                await refreshWhois(site.id, site.domain_name);
            }
        } finally {
            setRefreshAllBusy(false);
        }
    };

    const renderWebsiteRow = (site: Website, isSubdomain: boolean) => {
        const hostingPackage = packages.find(p => p.id === site.package_id);
        const currentData = { ...site, ...editingData[site.id] };
        const isEditing = !!editingData[site.id];

        return (
             <tr key={site.id} className={`${isEditing ? 'bg-yellow-50 dark:bg-yellow-900/20' : isSubdomain ? 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/80' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'} border-b border-gray-200 dark:border-gray-700`}>
                <td className="p-4 font-medium">
                     <div className="flex items-center">
                        {isSubdomain ? (
                            <>
                                <span className="text-gray-400 mr-2 ml-7">↳</span>
                                <span className="text-gray-700 dark:text-gray-300">{site.domain_name}</span>
                            </>
                        ) : (
                             <>
                                { (site as GroupedWebsite).subdomains && (site as GroupedWebsite).subdomains.length > 0 && (
                                     <button onClick={() => toggleRow(site.id)} className="mr-2 text-gray-500 w-5">
                                         <i className={`fas fa-chevron-right transition-transform ${expandedRows[site.id] ? 'rotate-90' : ''}`}></i>
                                     </button>
                                 )}
                                 <span className={`text-primary-600 dark:text-primary-400 ${(site as GroupedWebsite).subdomains?.length === 0 ? 'ml-7' : ''}`}>{site.domain_name}</span>
                             </>
                        )}
                        <ExpiryIndicator expiryDate={site.expiry_date} />
                    </div>
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">{hostingPackage?.name || 'N/A'}</td>
                <td className="p-4 text-gray-600 dark:text-gray-300 min-w-[200px]">
                   {editMode ? (
                        <input type="number" value={currentData.disk_usage_mb} onChange={(e) => handleEditChange(site.id, 'disk_usage_mb', e.target.value)} className="form-input-sm"/>
                   ) : hostingPackage ? (
                        <ResourceUsageBar current={site.disk_usage_mb} limit={hostingPackage.disk_space_gb * 1024} label="" unit="MB" />
                    ): formatDiskUsage(site.disk_usage_mb)}
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">
                    {isSubdomain ? (
                        <span className="text-gray-400">—</span>
                    ) : (
                        (() => {
                            const subs = (site as any).subdomains || [];
                            const mainDisk = Number(currentData.disk_usage_mb || 0);
                            const subsDisk = subs.reduce((sum: number, s: Website) => {
                                const edited = editingData[s.id]?.disk_usage_mb;
                                return sum + Number((typeof edited !== 'undefined' ? edited : s.disk_usage_mb) || 0);
                            }, 0);
                            const totalMb = mainDisk + subsDisk;
                            return <span className="font-medium">{formatDiskUsage(totalMb)}</span>;
                        })()
                    )}
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300 min-w-[200px]">
                     {editMode ? (
                         <input type="number" value={currentData.inodes} onChange={(e) => handleEditChange(site.id, 'inodes', e.target.value)} className="form-input-sm"/>
                     ) : hostingPackage ? (
                        <ResourceUsageBar current={site.inodes} limit={hostingPackage.inodes_limit} label="" unit="" />
                    ): site.inodes.toLocaleString()}
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">
                    {isSubdomain ? (
                        <span className="text-gray-400">—</span>
                    ) : (
                        (() => {
                            const subs = (site as any).subdomains || [];
                            const mainInodes = Number(currentData.inodes || 0);
                            const subsInodes = subs.reduce((sum: number, s: Website) => {
                                const edited = editingData[s.id]?.inodes;
                                return sum + Number((typeof edited !== 'undefined' ? edited : s.inodes) || 0);
                            }, 0);
                            const total = mainInodes + subsInodes;
                            return <span className="font-medium">{total.toLocaleString()}</span>;
                        })()
                    )}
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">
                    {site.expiry_date ? (
                        <>
                            {new Date(site.expiry_date).toLocaleDateString()}
                            {(() => {
                                const info = getExpiryInfo(site.expiry_date);
                                if (!info) return null;
                                if (info.isExpired) {
                                    return <span className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Expired {Math.abs(info.daysLeft)}d</span>;
                                }
                                if (info.isExpiring) {
                                    return <span className="ml-2 px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">In {info.daysLeft}d</span>;
                                }
                                return <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Active</span>;
                            })()}
                            {!isSubdomain && (
                                <button
                                    onClick={() => refreshWhois(site.id, site.domain_name)}
                                    className="ml-2 inline-flex items-center text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title="Refresh WHOIS"
                                >
                                    {refreshing[site.id] ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-sync mr-1"></i>}
                                    Refresh
                                </button>
                            )}
                        </>
                    ) : 'N/A'}
                </td>
                 {editMode && (
                     <td className="p-4 text-center">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <button onClick={() => handleSave(site.id)} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"><i className="fas fa-check"></i></button>
                                <button onClick={() => handleCancel(site.id)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"><i className="fas fa-times"></i></button>
                            </div>
                        ) : <span className="text-xs text-gray-400">Editable</span>}
                     </td>
                 )}
                <td className="p-4 text-gray-500 dark:text-gray-400">{site.last_modified}</td>
           </tr>
        );
    }

    return (
         <div className="shadow-lg rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Manage domains and WHOIS expiry
                </div>
                <button
                    onClick={refreshAllWhois}
                    disabled={refreshAllBusy}
                    className={`inline-flex items-center text-xs px-3 py-1.5 rounded border ${refreshAllBusy ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                    title="Refresh WHOIS semua domain utama"
                >
                    {refreshAllBusy ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-sync mr-2"></i>}
                    Refresh WHOIS semua
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Domain</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Package</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Disk Usage</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Total Disk Usage</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Inodes</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Total Inodes</th>
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Expiry Date</th>
                            {editMode && <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Save</th>}
                            <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Last Modified</th>
                        </tr>
                    </thead>
                    <tbody>
                       {groupedWebsites.map(group => (
                           <React.Fragment key={group.id}>
                               {renderWebsiteRow(group, false)}
                                {expandedRows[group.id] && group.subdomains.map(subdomain => (
                                    renderWebsiteRow(subdomain, true)
                                ))}
                           </React.Fragment>
                       ))}
                    </tbody>
                </table>
            </div>
             <style>{`.form-input-sm { padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; width: 100px; } .dark .form-input-sm { background-color: #374151; border-color: #4b5563; }`}</style>
        </div>
    );
};


const Websites: React.FC<WebsitesProps> = ({ user }) => {
    const [allWebsites, setAllWebsites] = useState<Website[]>([]);
    const [hostingPackages, setHostingPackages] = useState<HostingPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [editMode, setEditMode] = useState(false);

     useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchDashboardData();
                setAllWebsites(data.websites);
                setHostingPackages(data.hostingPackages);
            } catch (error) {
                console.error("Failed to fetch websites data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    
    useEffect(() => {
        if (user.role !== 'superadmin') {
            setEditMode(false);
        }
    }, [user]);

    const handleUpdateWebsite = async (id: number, data: Partial<Website>) => {
        setAllWebsites(prev => prev.map(site => site.id === id ? { ...site, ...data } : site));
        try {
            const payload: Partial<Website> = {};
            if (typeof data.disk_usage_mb !== 'undefined') payload.disk_usage_mb = data.disk_usage_mb;
            if (typeof data.inodes !== 'undefined') payload.inodes = data.inodes;
            if (typeof data.expiry_date !== 'undefined') payload.expiry_date = data.expiry_date;
            if (Object.keys(payload).length > 0) {
                await (await import('../utils/api')).updateWebsiteUsage(id, payload as any);
            }
        } catch (e) {
            console.error('Failed to persist website updates:', e);
        }
    };

    const filteredWebsites = useMemo(() => {
        if (!filter) return allWebsites;
        const lowerCaseFilter = filter.toLowerCase();
        return allWebsites.filter(w => w.domain_name.toLowerCase().includes(lowerCaseFilter));
    }, [allWebsites, filter]);

    const groupedAndFilteredWebsites = useMemo(() => {
        const mainDomains = allWebsites.filter(w => !w.parentId);
        const subDomains = allWebsites.filter(w => w.parentId);

        const grouped = mainDomains.map(main => ({
            ...main,
            subdomains: subDomains.filter(sub => sub.parentId === main.id)
        }));
        
        if (!filter) return grouped;

        const lowerCaseFilter = filter.toLowerCase();
        return grouped.filter(group => {
            const hasMatchingSubdomain = group.subdomains.some(sub => sub.domain_name.toLowerCase().includes(lowerCaseFilter));
            return group.domain_name.toLowerCase().includes(lowerCaseFilter) || hasMatchingSubdomain;
        });
    }, [allWebsites, filter]);

    const ViewSwitcher: React.FC = () => {
        const baseClass = "px-3 py-1.5 rounded-md text-gray-500 dark:text-gray-400 transition-colors";
        const activeClass = "bg-primary-500 text-white shadow";
        const inactiveClass = "hover:bg-gray-200 dark:hover:bg-gray-700";

        return (
            <div className="flex items-center bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`${baseClass} ${viewMode === 'grid' ? activeClass : inactiveClass}`}>
                    <i className="fas fa-th-large"></i>
                </button>
                 <button onClick={() => setViewMode('list')} className={`${baseClass} ${viewMode === 'list' ? activeClass : inactiveClass}`}>
                    <i className="fas fa-list"></i>
                </button>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Websites...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="mb-0">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Domains</h1>
                    <p className="text-gray-500 dark:text-gray-400">All hosting accounts and domains.</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {user.role === 'superadmin' && (
                        <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-lg">
                            <label htmlFor="editMode" className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Edit Mode</label>
                            <input 
                                type="checkbox"
                                id="editMode"
                                checked={editMode}
                                onChange={(e) => setEditMode(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                    )}
                    <div className="relative flex-grow sm:flex-grow-0">
                        <input
                            type="text"
                            placeholder="Search domains..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <ViewSwitcher />
                </div>
            </div>
            
            {editMode && user.role === 'superadmin' && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Admin Edit Mode is Active</p>
                    <p>You can now directly edit resource usage values in the table below. Click Save on each row to apply changes.</p>
                </div>
            )}

            {viewMode === 'grid' ? <GridView websites={filteredWebsites} packages={hostingPackages} /> : <ListView groupedWebsites={groupedAndFilteredWebsites} packages={hostingPackages} editMode={editMode} onUpdate={handleUpdateWebsite} />}

            {(filteredWebsites.length === 0 || (viewMode === 'list' && groupedAndFilteredWebsites.length === 0)) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg text-center py-16 text-gray-500">
                    <i className="fas fa-cloud-slash text-5xl mb-4"></i>
                    <h3 className="text-xl font-semibold">No Domains Found</h3>
                    <p>No websites found matching your search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default Websites;
