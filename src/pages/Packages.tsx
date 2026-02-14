import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HostingPackage, SiteSettings } from '../data/mockData';
import { fetchDashboardData } from '../utils/api';

const PackageCard: React.FC<{ pkg: HostingPackage, subtitle?: string }> = ({ pkg, subtitle }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const getBorderColor = (name: HostingPackage['name']) => {
        switch(name) {
            case 'Starter': return 'border-gray-300 dark:border-gray-600';
            case 'Personal': return 'border-blue-500';
            case 'Business': return 'border-primary-500';
            case 'Enterprise': return 'border-purple-500';
            default: return 'border-gray-300';
        }
    }
    
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 ${getBorderColor(pkg.name)} flex flex-col`}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{pkg.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{subtitle || 'Ideal for growing projects.'}</p>
            </div>
            
            <div className="p-6 border-t border-b border-gray-200 dark:border-gray-700 flex-grow">
                <p className="text-4xl font-bold">{formatCurrency(pkg.monthly_price_idr)}<span className="text-lg font-normal text-gray-500">/mo</span></p>
                <p className="text-md text-gray-500 dark:text-gray-400 -mt-2 mb-2">
                    ({formatCurrency(pkg.monthly_price_idr * 12)} / year)
                </p>
                <ul className="space-y-3 mt-4 text-gray-600 dark:text-gray-300">
                    {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                             <i className="fas fa-check-circle text-green-500 mr-3"></i>
                            <span>{feature}</span>
                        </li>
                    ))}
                     <li className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
                        <i className="fas fa-star fa-fw mr-3"></i>
                        <span>Web Development Included</span>
                    </li>
                </ul>
            </div>

            <div className="p-6 flex justify-end items-center bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                 <Link to={`/panel/packages/edit/${pkg.id}`} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold">
                    Edit Package
                </Link>
            </div>
        </div>
    );
};


const Packages: React.FC = () => {
    // FIX: fetch packages from API instead of using mock data
    const [packages, setPackages] = useState<HostingPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchDashboardData();
                setPackages(data.hostingPackages);
                setSettings(data.settings || null);
            } catch (error) {
                console.error("Failed to fetch packages data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Packages...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Hosting Packages</h1>
                <Link to="/panel/packages/edit/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                   <i className="fas fa-plus mr-2"></i> Add New Package
                </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {packages.map(pkg => (
                    <PackageCard key={pkg.id} pkg={pkg} subtitle={pkg.subtitle || settings?.packagesPage?.subtitle} />
                ))}
            </div>
        </div>
    );
};

export default Packages;
