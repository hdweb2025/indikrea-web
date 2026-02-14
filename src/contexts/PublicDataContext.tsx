import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiteSettings, HostingPackage } from '../data/mockData';
import { fetchPublicData } from '../utils/api';

interface PublicDataContextType {
    settings: SiteSettings | null;
    packages: HostingPackage[];
    loading: boolean;
}

const PublicDataContext = createContext<PublicDataContextType>({
    settings: null,
    packages: [],
    loading: true,
});

export const usePublicData = () => useContext(PublicDataContext);

export const PublicDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [packages, setPackages] = useState<HostingPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPublicData = async () => {
            try {
                const data = await fetchPublicData();
                setSettings(data.settings);
                setPackages(data.hostingPackages);
            } catch (error) {
                console.error("Failed to fetch public site data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPublicData();
    }, []);

    return (
        <PublicDataContext.Provider value={{ settings, packages, loading }}>
            {children}
        </PublicDataContext.Provider>
    );
};
