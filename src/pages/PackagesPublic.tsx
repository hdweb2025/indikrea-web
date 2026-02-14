import React from 'react';
import { Link } from 'react-router-dom';
import { HostingPackage } from '../data/mockData';
import { usePublicData } from '../contexts/PublicDataContext';

const PublicPackageCard: React.FC<{ pkg: HostingPackage }> = ({ pkg }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const getBorderColor = (name: HostingPackage['name']) => {
        switch(name) {
            case 'Business': return 'border-primary-500 scale-105 z-10';
            default: return 'border-gray-200 dark:border-gray-700';
        }
    }
    
    return (
        <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-t-4 flex flex-col transition-transform duration-300 hover:scale-105 ${getBorderColor(pkg.name)}`}>
            {pkg.name === 'Business' && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>}
            <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{pkg.name}</h3>
                <p className="mt-4 text-4xl font-bold">{formatCurrency(pkg.monthly_price_idr * 12)}<span className="text-lg font-normal text-gray-500">/yr</span></p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    from {formatCurrency(pkg.monthly_price_idr)}/mo, billed annually.
                </p>
            </div>
            <div className="p-8 border-t border-gray-200 dark:border-gray-700 flex-grow">
                <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                    {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                            <i className="fas fa-check-circle text-green-500 mr-3"></i>
                            <span>{feature}</span>
                        </li>
                    ))}
                    <li className="flex items-center font-semibold text-gray-800 dark:text-gray-100">
                        <i className="fas fa-star text-yellow-500 mr-3"></i>
                        <span>Web Development Included</span>
                    </li>
                </ul>
            </div>
            <div className="p-6">
                 <Link to={`/register/${pkg.id}`} className="block w-full text-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                    Subscribe Now
                </Link>
            </div>
        </div>
    );
};

const PackagesPublic: React.FC = () => {
    const { packages, settings, loading } = usePublicData();
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
            </div>
        );
    }
    
    return (
        <section id="packages" className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">{settings?.packagesPage.title || 'Choose the Perfect Plan'}</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{settings?.packagesPage.subtitle || 'Scalable plans that grow with your business.'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {packages.map(pkg => (
                        <PublicPackageCard key={pkg.id} pkg={pkg} />
                    ))}
                </div>

                {settings?.packagesPage.faq && settings.packagesPage.faq.length > 0 && (
                    <div className="mt-20 max-w-3xl mx-auto">
                         <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h3>
                         <div className="space-y-4">
                            {settings.packagesPage.faq.map((item, index) => (
                                <details key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm cursor-pointer group">
                                    <summary className="font-semibold text-lg list-none flex justify-between items-center">
                                        {item.q}
                                        <i className="fas fa-chevron-down transition-transform duration-300 group-open:rotate-180"></i>
                                    </summary>
                                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                                        {item.a}
                                    </p>
                                </details>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PackagesPublic;