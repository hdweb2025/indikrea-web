import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HostingPackage, Registration } from '../data/mockData';
import { API_BASE_URL } from '../utils/api';

// FIX: mockHostingPackages is no longer exported. For this public page,
// we define the data locally as there is no public API endpoint.
const mockHostingPackagesData: HostingPackage[] = [
    { id: 1, name: 'Starter', disk_space_gb: 1, inodes_limit: 50000, monthly_price_idr: 25000, features: ['1 GB NVMe SSD', '10 GB Bandwidth', '5 Email Accounts', 'Free SSL'] },
    { id: 2, name: 'Personal', disk_space_gb: 5, inodes_limit: 150000, monthly_price_idr: 75000, features: ['5 GB NVMe SSD', '50 GB Bandwidth', '20 Email Accounts', 'Free SSL & CDN'] },
    { id: 3, name: 'Business', disk_space_gb: 10, inodes_limit: 300000, monthly_price_idr: 150000, features: ['10 GB NVMe SSD', 'Unmetered Bandwidth', 'Unlimited Emails', 'Daily Backups'] },
    { id: 4, name: 'Enterprise', disk_space_gb: 50, inodes_limit: 1000000, monthly_price_idr: 500000, features: ['50 GB NVMe SSD', 'Priority Support', 'Staging Site', 'Premium Security'] },
];


const Register: React.FC = () => {
    const { packageId } = useParams<{ packageId: string }>();
    const navigate = useNavigate();
    const [selectedPackage, setSelectedPackage] = useState<HostingPackage | null>(null);
    
    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Added state for password
    
    // Domain Check State
    const [domainName, setDomainName] = useState('');
    const isValidDomainLabel = (s: string) => {
        if (!s) return false;
        if (s.length > 63) return false;
        if (s.startsWith('-') || s.endsWith('-')) return false;
        // Allow alphanumeric and hyphens
        return /^[a-z0-9-]+$/.test(s);
    };
    const [selectedTld, setSelectedTld] = useState('com');
    const [isCheckingDomain, setIsCheckingDomain] = useState(false);
    const [domainStatus, setDomainStatus] = useState<'available' | 'taken' | 'error' | null>(null);
    const [domainPrice, setDomainPrice] = useState<number>(0);
    const [domainMessage, setDomainMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const calculatePasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 0) {
            if (pass.length > 7) score++;
            if (/[A-Z]/.test(pass)) score++;
            if (/[0-9]/.test(pass)) score++;
            if (/[^A-Za-z0-9]/.test(pass)) score++;
        }
        return score;
    };

    const getStrengthColor = (score: number) => {
        if (score === 0) return 'bg-gray-200 dark:bg-gray-700';
        if (score <= 2) return 'bg-red-500';
        if (score === 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthLabel = (score: number) => {
        if (score === 0) return '';
        if (score <= 2) return 'Weak';
        if (score === 3) return 'Medium';
        return 'Strong';
    };

    const tldOptions = [
        { value: 'com', label: '.com', price: 250000 },
        { value: 'net', label: '.net', price: 300000 },
        { value: 'org', label: '.org', price: 160000 },
        { value: 'id', label: '.id', price: 300000 },
        { value: 'co.id', label: '.co.id', price: 300000 },
        { value: 'my.id', label: '.my.id', price: 300000 },
        { value: 'web.id', label: '.web.id', price: 300000 },
        { value: 'xyz', label: '.xyz', price: 30000 },
    ];

    useEffect(() => {
        if (packageId) {
            const pkg = mockHostingPackagesData.find(p => p.id === parseInt(packageId));
            if (pkg) {
                setSelectedPackage(pkg);
            } else {
                navigate('/'); // Redirect if package not found
            }
        }
    }, [packageId, navigate]);

    const handleCheckDomain = async () => {
        if (!domainName) {
            alert("Please enter a domain name");
            return;
        }

        setIsCheckingDomain(true);
        setDomainStatus(null);
        setDomainMessage('');
        setDomainPrice(0);

        try {
            const response = await fetch('/api/domain_check.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: domainName,
                    tlds: [selectedTld]
                })
            });

            const result = await response.json();

            if (result.success && result.data && result.data.data) {
                const availability = result.data.data[0]; // First TLD result
                
                if (availability.status === 'available') {
                    setDomainStatus('available');
                    // Find local price for the TLD
                    const tldInfo = tldOptions.find(t => t.value === selectedTld);
                    setDomainPrice(tldInfo ? tldInfo.price : 250000); 
                    setDomainMessage(`Selamat, ${domainName}.${selectedTld} bisa anda pesan.`);
                } else {
                    setDomainStatus('taken');
                    setDomainMessage(`Maaf, nama itu sudah ada yang memiliki.`);
                }
            } else {
                setDomainStatus('error');
                setDomainMessage(result.message || 'Error checking domain availability.');
                if (result.details) console.error("API Error Details:", result.details);
            }
        } catch (error) {
            console.error('Domain check error:', error);
            setDomainStatus('error');
            setDomainMessage('Failed to connect to server.');
        } finally {
            setIsCheckingDomain(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage) return;
        
        // Validation: Ensure domain is checked and available
        if (domainStatus !== 'available') {
            alert("Please check your domain availability first!");
            return;
        }

        // Create and save the new registration object
        const fullDomain = `${domainName}.${selectedTld}`;
        const newRegistration: Omit<Registration, 'id' | 'registrationDate' | 'status'> & { password: string } = {
            fullName,
            email,
            desiredDomain: fullDomain,
            packageId: selectedPackage.id,
            password
        };
        try {
            const resp = await fetch(`${API_BASE_URL}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRegistration)
            });
            const result = await resp.json();
            if (!resp.ok || !result.success) {
                throw new Error(result.message || 'Failed to save registration');
            }
            console.log("New registration saved:", { id: result.id, ...newRegistration });
        } catch (error) {
            console.error("Registration save failed:", error);
            alert("Maaf, pendaftaran gagal disimpan. Silakan coba lagi.");
            return;
        }
        
        setIsSubmitted(true);
        setTimeout(() => {
            navigate('/login/client');
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-check text-3xl text-green-600 dark:text-green-400"></i>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Registration Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                    Thank you for subscribing to the {selectedPackage?.name} package. We are redirecting you to the client login page...
                </p>
            </div>
        );
    }

     if (!selectedPackage) {
        return <div>Loading package...</div>;
    }
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const packagePrice = selectedPackage.monthly_price_idr * 12;
    const totalDue = packagePrice + domainPrice;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Start your journey with Indikrea Hosting.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Domain Input - MOVED TO TOP */}
                        <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-gray-700 mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain yang Anda Inginkan</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="example" 
                                    value={domainName} 
                                    onChange={e => {
                                        let v = e.target.value.toLowerCase();
                                        
                                        // Handle copy-paste or typing of full domain (e.g. "example.com")
                                        if (v.includes('.')) {
                                            const parts = v.split('.');
                                            if (parts.length > 1) {
                                                const possibleTld = parts[parts.length - 1];
                                                // Check if the last part matches any of our TLD options
                                                const matchedTld = tldOptions.find(t => t.value === possibleTld);
                                                if (matchedTld) {
                                                    setSelectedTld(matchedTld.value);
                                                    v = parts.slice(0, parts.length - 1).join('.'); // Take the rest as domain name
                                                }
                                            }
                                        }

                                        // Remove invalid characters but allow typing logic to handle split first
                                        v = v.replace(/[^a-z0-9-]/g, '');
                                        setDomainName(v);
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCheckDomain();
                                        }
                                    }}
                                    className={`flex-1 form-input text-lg py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 ${domainName && !isValidDomainLabel(domainName) ? 'border-red-500 focus:border-red-500' : ''}`}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                <select 
                                    value={selectedTld} 
                                    onChange={e => setSelectedTld(e.target.value)}
                                    className="form-input w-28 text-lg"
                                >
                                    {tldOptions.map(tld => (
                                        <option key={tld.value} value={tld.value}>.{tld.value}</option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={handleCheckDomain}
                                    disabled={isCheckingDomain || !isValidDomainLabel(domainName)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {isCheckingDomain ? <i className="fas fa-spinner fa-spin"></i> : 'Check'}
                                </button>
                            </div>
                            {domainName && (
                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Preview: {domainName}.{selectedTld}
                                </div>
                            )}
                            {domainName && !isValidDomainLabel(domainName) && (
                                <div className="mt-1 text-xs text-red-600">Hanya huruf, angka, dan tanda minus. Tidak boleh diawali/diakhiri tanda minus.</div>
                            )}
                            
                            {/* Domain Status Feedback */}
                            {domainStatus && (
                                <div className={`mt-2 text-sm font-medium ${
                                    domainStatus === 'available' ? 'text-green-600' : 
                                    domainStatus === 'taken' ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                    {domainMessage}
                                    {domainStatus === 'available' && (
                                        <span className="block text-gray-600 dark:text-gray-400 font-normal">
                                            Price: {formatCurrency(domainPrice)}/year
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="fullName">Full Name</label>
                            <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mt-1 form-input" />
                        </div>
                         <div>
                            <label htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                className="w-full mt-1 form-input" 
                            />
                            {/* Password Strength Meter */}
                            {password && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-300 ${getStrengthColor(calculatePasswordStrength(password))}`} 
                                            style={{ width: `${(calculatePasswordStrength(password) / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Strength</span>
                                        <span className={`text-xs font-medium ${
                                            calculatePasswordStrength(password) <= 2 ? 'text-red-500' : 
                                            calculatePasswordStrength(password) === 3 ? 'text-yellow-500' : 'text-green-500'
                                        }`}>
                                            {getStrengthLabel(calculatePasswordStrength(password))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                         <button type="submit" className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 mt-6" disabled={domainStatus !== 'available'}>
                            Complete Registration
                        </button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg mt-10 sticky top-4">
                     <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                     <div className="space-y-4">
                        <div className="flex justify-between">
                            <span>Package:</span>
                            <span className="font-semibold">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Hosting (1 Year):</span>
                            <span className="font-semibold">{formatCurrency(packagePrice)}</span>
                        </div>
                        
                        {/* Domain Line Item */}
                        {domainStatus === 'available' && (
                            <div className="flex justify-between text-green-600">
                                <span>Domain Registration:</span>
                                <span className="font-semibold">{formatCurrency(domainPrice)}</span>
                            </div>
                        )}

                        <div className="border-t dark:border-gray-700 pt-4 mt-4 flex justify-between text-xl font-bold">
                            <span>Total Due Today:</span>
                            <span>{formatCurrency(totalDue)}</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
