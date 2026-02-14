import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicData } from '../contexts/PublicDataContext';

// Import images
import heroImage from '../data/indikrea-hosting-pic-model.webp';
import client1 from '../data/client-crystalqua.png';
import client2 from '../data/client-ikapmawi-logo.png';
import client3 from '../data/client-ipb.png';
import client4 from '../data/client-mwi-kebarongan.png';
import client5 from '../data/client-nextmove.png';
import client6 from '../data/client-rdm-logo.png';
import client7 from '../data/client-tutwuri.png';
import client8 from '../data/client-yayasan-alittihad.png';

const clientLogos = [client1, client2, client3, client4, client5, client6, client7, client8];

const Home: React.FC = () => {
    const { settings, loading } = usePublicData();
    const generalSettings = settings?.general;

    // Helper to render title with highlighted part
    const renderHeroTitle = () => {
        if (!generalSettings?.heroTitle) return null;
        const parts = generalSettings.heroTitle.split(/(\[highlight\].*?\[\/highlight\])/);
        return parts.map((part, index) => {
            if (part.startsWith('[highlight]')) {
                const text = part.replace('[highlight]', '').replace('[/highlight]', '');
                return <span key={index} className="text-primary-500">{text}</span>;
            }
            return part;
        });
    };
    
    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                 <i className="fas fa-spinner fa-spin text-primary-500 text-4xl"></i>
            </div>
        );
    }

    return (
        <>
            {/* Hero Section */}
            <section className="bg-white dark:bg-gray-800 overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-100 dark:bg-primary-900/20 blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>

                <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        {/* Text Content */}
                        <div className="w-full md:w-1/2 text-center md:text-left space-y-6 animate-fade-in-up">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 dark:text-white leading-tight">
                                {renderHeroTitle()}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                                {generalSettings?.heroSubtitle}
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Link to="/packages" className="px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 shadow-lg hover:shadow-primary-500/30 transition-all transform hover:-translate-y-1">
                                    {generalSettings?.heroButtonText}
                                </Link>
                                <Link to="/login/client" className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 text-lg font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">
                                    Client Login
                                </Link>
                            </div>
                        </div>

                        {/* Hero Image with Modern Transition */}
                        <div className="w-full md:w-1/2 flex justify-center relative">
                            <div className="relative w-full max-w-lg aspect-square">
                                {/* Abstract shape behind image */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-blue-200 dark:from-primary-900/40 dark:to-blue-900/40 rounded-full blur-2xl transform scale-90 animate-blob"></div>
                                <img 
                                    src={heroImage} 
                                    alt="Modern Hosting" 
                                    className="relative z-10 w-full h-auto object-contain drop-shadow-2xl animate-float"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Persuasive Section */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
                            Mengapa Anda Perlu <span className="text-primary-600">Website</span> Sekarang?
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left mt-12">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-6 text-primary-600 text-2xl">
                                    <i className="fas fa-globe"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Jangkauan Tanpa Batas</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Website adalah etalase bisnis yang buka 24/7. Tanpa batas geografis, Anda bisa menjangkau pelanggan dari seluruh dunia, kapan saja.
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-blue-600 text-2xl">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Kredibilitas Profesional</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    84% konsumen lebih percaya pada bisnis yang memiliki website. Tunjukkan bahwa Anda serius dan profesional dalam bisnis Anda.
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-6 text-green-600 text-2xl">
                                    <i className="fas fa-bullhorn"></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Marketing Efektif</h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Website adalah pusat strategi marketing digital Anda. Dari SEO hingga iklan sosial media, semua bermuara ke website Anda.
                                </p>
                            </div>
                        </div>
                        <div className="mt-12 p-8 bg-gradient-to-r from-primary-600 to-blue-600 rounded-3xl text-white shadow-xl transform hover:scale-[1.02] transition-transform duration-300">
                            <p className="text-xl md:text-2xl font-medium leading-relaxed italic">
                                "Jangan biarkan kompetitor Anda melangkah lebih jauh hanya karena mereka online lebih dulu. Website bukan sekadar tren, tapi fondasi bisnis modern. Mulai sekarang, atau tertinggal selamanya."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By Section */}
            <section className="py-16 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Dipercaya oleh berbagai institusi & bisnis</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {clientLogos.map((logo, index) => (
                            <img 
                                key={index} 
                                src={logo} 
                                alt={`Client Logo ${index + 1}`} 
                                className="h-12 md:h-16 w-auto object-contain transition-transform hover:scale-110"
                            />
                        ))}
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
            `}</style>
        </>
    );
};

export default Home;