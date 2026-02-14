import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicData } from '../contexts/PublicDataContext';

const PublicFooter: React.FC = () => {
    const { settings, loading } = usePublicData();

    const renderLink = (text: string, url: string) => {
        const isInternalRoute = url.startsWith('/') && !url.includes('.');
        const isAnchorLink = url.includes('/#');
        
        if (isAnchorLink) {
             const correctedUrl = url.replace('/#', '#'); // Fix for HashRouter anchor links
             return <a href={correctedUrl} className="hover:text-white transition-colors">{text}</a>;
        }

        if (isInternalRoute) {
            return <Link to={url} className="hover:text-white transition-colors">{text}</Link>;
        }
        return <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{text}</a>;
    };

    if (loading) {
        return <footer className="bg-gray-800 h-24"></footer>;
    }

    return (
        <footer className="bg-gray-800 text-gray-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center">
                            <img src={(settings?.company?.companyLogo || '/icon.png')} alt={`${(settings?.general?.siteName || 'Indikrea')} Logo`} className="h-9 w-auto" />
                            <span className="ml-3 text-2xl font-bold text-white">{settings?.general?.siteName || 'Indikrea'}</span>
                        </div>
                        <p className="mt-4 text-sm text-gray-400">
                           {settings?.footer?.slogan || ''}
                        </p>
                    </div>
                    
                    {/* Dynamic Link Columns */}
                    {(settings?.footer?.linkColumns || []).map((column, index) => (
                         <div key={index}>
                            <h3 className="font-semibold text-white tracking-wider uppercase">{column.title}</h3>
                            <ul className="mt-4 space-y-2">
                                {(column.links || []).map((link, linkIndex) => (
                                    <li key={linkIndex}>{renderLink(link.text, link.url)}</li>
                                ))}
                            </ul>
                        </div>
                    ))}

                </div>
                <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} {(settings?.footer?.copyrightName || 'Indikrea')}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
