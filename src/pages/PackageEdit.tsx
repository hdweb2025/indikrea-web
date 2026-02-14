import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HostingPackage } from '../data/mockData';
import { fetchDashboardData, updateHostingPackage } from '../utils/api';

const PackageEdit: React.FC = () => {
    const { packageId } = useParams<{ packageId: string }>();
    const navigate = useNavigate();
    const isNew = packageId === 'new';

    const [pkg, setPkg] = useState<Partial<HostingPackage>>({
        name: 'Starter',
        subtitle: 'Ideal for growing projects.',
        disk_space_gb: 1,
        inodes_limit: 50000,
        monthly_price_idr: 0,
        features: ['']
    });
    const [loading, setLoading] = useState(!isNew);

    useEffect(() => {
        if (!isNew && packageId) {
            const loadPackage = async () => {
                setLoading(true);
                try {
                    const { hostingPackages } = await fetchDashboardData();
                    const existing = hostingPackages.find(p => p.id === parseInt(packageId));
                    if (existing) {
                        setPkg(existing);
                    } else {
                        navigate('/panel/packages');
                    }
                } catch (error) {
                    console.error("Failed to load package data:", error);
                    navigate('/panel/packages');
                } finally {
                    setLoading(false);
                }
            };
            loadPackage();
        }
    }, [packageId, isNew, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setPkg(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const newFeatures = [...(pkg.features || [])];
        newFeatures[index] = value;
        setPkg(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setPkg(prev => ({ ...prev, features: [...(prev.features || []), ''] }));
    };
    
    const removeFeature = (index: number) => {
        const newFeatures = [...(pkg.features || [])];
        newFeatures.splice(index, 1);
        setPkg(prev => ({ ...prev, features: newFeatures }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                id: isNew ? undefined : pkg.id,
                name: pkg.name!,
                subtitle: String(pkg.subtitle || ''),
                disk_space_gb: Number(pkg.disk_space_gb || 0),
                inodes_limit: Number(pkg.inodes_limit || 0),
                monthly_price_idr: Number(pkg.monthly_price_idr || 0),
                features: (pkg.features || []).filter(f => typeof f === 'string')
            };
            await updateHostingPackage(payload);
            alert(`Package data for "${pkg.name}" has been saved.`);
            navigate('/panel/packages');
        } catch (err: any) {
            alert(err?.message || 'Failed to save package.');
        }
    };
    
    const formStyle = `
        .form-input { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; }
        .dark .form-input { background-color: #374151; border-color: #4b5563; color: #d1d5db; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.5); }
    `;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <i className="fas fa-spinner fa-spin text-primary-500 text-3xl"></i>
                <span className="ml-4 text-lg">Loading Package...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
                 <button onClick={() => navigate('/panel/packages')} className="text-gray-500 hover:text-primary-500" title="Back to Packages">
                    <i className="fas fa-arrow-left text-2xl"></i>
                </button>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    {isNew ? 'Add New Package' : `Edit Package: ${pkg.name}`}
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name">Package Name</label>
                            <select name="name" id="name" value={pkg.name} onChange={handleChange} required className="mt-1 form-input">
                                <option>Starter</option>
                                <option>Personal</option>
                                <option>Business</option>
                                <option>Enterprise</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="subtitle">Subtitle</label>
                            <input type="text" name="subtitle" id="subtitle" value={pkg.subtitle || ''} onChange={handleChange} className="mt-1 form-input" placeholder="e.g., Ideal for growing projects." />
                        </div>
                        <div>
                            <label htmlFor="monthly_price_idr">Monthly Price (IDR)</label>
                            <input type="number" name="monthly_price_idr" id="monthly_price_idr" value={pkg.monthly_price_idr} onChange={handleChange} required className="mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="disk_space_gb">Disk Space (GB)</label>
                            <input type="number" name="disk_space_gb" id="disk_space_gb" value={pkg.disk_space_gb} onChange={handleChange} required className="mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="inodes_limit">Inodes Limit</label>
                            <input type="number" name="inodes_limit" id="inodes_limit" value={pkg.inodes_limit} onChange={handleChange} required className="mt-1 form-input" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">Features</h3>
                        <div className="space-y-2">
                        {(pkg.features || []).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={feature} 
                                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                                    className="form-input flex-grow"
                                    placeholder="e.g., 10 GB Bandwidth"
                                />
                                <button type="button" onClick={() => removeFeature(index)} className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">&times;</button>
                            </div>
                        ))}
                        </div>
                        <button type="button" onClick={addFeature} className="mt-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">+ Add Feature</button>
                    </div>

                     <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={() => navigate('/panel/packages')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                            Save Package
                        </button>
                    </div>
                </form>
            </div>
            <style>{formStyle}</style>
        </div>
    );
};

export default PackageEdit;
