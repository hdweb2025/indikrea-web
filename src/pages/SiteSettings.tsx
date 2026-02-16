import React, { useState, useEffect } from 'react';
import { SiteSettings, mockSiteSettings } from '../data/mockData';
import { usePublicData } from '../contexts/PublicDataContext';
import { updateSiteSettings } from '../utils/api';

const mergeSettings = (incoming: any): SiteSettings => {
    const base = mockSiteSettings;
    const src = (incoming || {}) as Partial<SiteSettings>;
    return {
        ...base,
        ...src,
        general: {
            ...base.general,
            ...(src.general || {})
        },
        navigation: {
            ...base.navigation,
            ...(src.navigation || {}),
            headerLinks: src.navigation && src.navigation.headerLinks && src.navigation.headerLinks.length
                ? src.navigation.headerLinks
                : base.navigation.headerLinks
        },
        contact: {
            ...base.contact,
            ...(src.contact || {})
        },
        footer: {
            ...base.footer,
            ...(src.footer || {}),
            linkColumns: src.footer && src.footer.linkColumns && src.footer.linkColumns.length
                ? src.footer.linkColumns
                : base.footer.linkColumns
        },
        packagesPage: {
            ...base.packagesPage,
            ...(src.packagesPage || {}),
            faq: src.packagesPage && src.packagesPage.faq && src.packagesPage.faq.length
                ? src.packagesPage.faq
                : base.packagesPage.faq
        },
        company: {
            ...base.company,
            ...(src.company || {})
        },
        invoiceTemplate: {
            ...base.invoiceTemplate,
            ...(src.invoiceTemplate || {})
        }
    };
};

const SiteSettingsPage: React.FC = () => {
    const { settings: initialSettings, loading } = usePublicData();
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        if (loading) return;
        if (initialSettings && Object.keys(initialSettings as any).length > 0) {
            setSettings(mergeSettings(initialSettings));
        } else {
            setSettings(mockSiteSettings);
        }
    }, [initialSettings, loading]);

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    if (!settings) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-red-500">Failed to load settings or no settings found.</p>
                <button 
                    onClick={() => setSettings(mockSiteSettings)} 
                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                    Load Default Template
                </button>
            </div>
        );
    }

    const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (!settings) return;
        setSettings({ ...settings, general: { ...settings.general, [name]: value } });
    };

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (!settings) return;
        setSettings({ ...settings, contact: { ...(settings.contact || {}), [name]: value } });
    };
    
    const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (!settings) return;
        setSettings({ ...settings, footer: { ...(settings.footer || {}), [name]: value } });
    };
    
    const handleHeaderLinkChange = (index: number, field: 'text' | 'url', value: string) => {
        if (!settings) return;
        const current = settings.navigation?.headerLinks || [];
        const newLinks = [...current];
        newLinks[index][field] = value;
        setSettings({ ...settings, navigation: { ...(settings.navigation || { headerLinks: [] }), headerLinks: newLinks }});
    };
    
    const addHeaderLink = () => {
        if (!settings) return;
        const current = settings.navigation?.headerLinks || [];
        const newLinks = [...current, { text: '', url: '' }];
        setSettings({ ...settings, navigation: { ...(settings.navigation || { headerLinks: [] }), headerLinks: newLinks }});
    };
    
    const removeHeaderLink = (index: number) => {
        if (!settings) return;
        const current = settings.navigation?.headerLinks || [];
        const newLinks = [...current];
        newLinks.splice(index, 1);
        setSettings({ ...settings, navigation: { ...(settings.navigation || { headerLinks: [] }), headerLinks: newLinks }});
    };

    const handleFooterLinkChange = (colIndex: number, linkIndex: number, field: 'text' | 'url', value: string) => {
        if (!settings) return;
        const newSettings = { ...settings };
        newSettings.footer.linkColumns[colIndex].links[linkIndex][field] = value;
        setSettings(newSettings);
    };

    const addFooterLink = (colIndex: number) => {
        if (!settings) return;
        const newSettings = { ...settings };
        newSettings.footer.linkColumns[colIndex].links.push({ text: '', url: '' });
        setSettings(newSettings);
    };
    
    const removeFooterLink = (colIndex: number, linkIndex: number) => {
        if (!settings) return;
        const newSettings = { ...settings };
        newSettings.footer.linkColumns[colIndex].links.splice(linkIndex, 1);
        setSettings(newSettings);
    };

    // FIX: Add handlers for packages page settings
    const handlePackagesPageChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (!settings) return;
        setSettings({ ...settings, packagesPage: { ...settings.packagesPage, [name]: value } });
    };

    const handleFaqChange = (index: number, field: 'q' | 'a', value: string) => {
        if (!settings) return;
        const newFaq = [...settings.packagesPage.faq];
        newFaq[index][field] = value;
        setSettings({ ...settings, packagesPage: { ...settings.packagesPage, faq: newFaq } });
    };

    const addFaqItem = () => {
        if (!settings) return;
        const newFaq = [...settings.packagesPage.faq, { q: '', a: '' }];
        setSettings({ ...settings, packagesPage: { ...settings.packagesPage, faq: newFaq } });
    };

    const removeFaqItem = (index: number) => {
        if (!settings) return;
        const newFaq = [...settings.packagesPage.faq];
        newFaq.splice(index, 1);
        setSettings({ ...settings, packagesPage: { ...settings.packagesPage, faq: newFaq } });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        try {
            await updateSiteSettings(settings);
            alert('Site settings have been saved successfully!');
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            alert(error?.message || 'Error saving settings. Check console for details.');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Site Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage global settings for your public-facing website.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold border-b dark:border-gray-700 pb-4 mb-6">General Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="siteName">Site Name</label>
                            <input type="text" name="siteName" id="siteName" value={settings.general.siteName} onChange={handleGeneralChange} className="mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="heroTitle">Hero Title</label>
                            <textarea name="heroTitle" id="heroTitle" value={settings.general.heroTitle} onChange={handleGeneralChange} rows={2} className="mt-1 form-input" />
                             <p className="text-xs text-gray-500 mt-1">Use <code>[highlight]text[/highlight]</code> to apply primary color to a word.</p>
                        </div>
                        <div>
                            <label htmlFor="heroSubtitle">Hero Subtitle</label>
                            <textarea name="heroSubtitle" id="heroSubtitle" value={settings.general.heroSubtitle} onChange={handleGeneralChange} rows={3} className="mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="heroButtonText">Hero Button Text</label>
                            <input type="text" name="heroButtonText" id="heroButtonText" value={settings.general.heroButtonText} onChange={handleGeneralChange} className="mt-1 form-input" />
                        </div>
                    </div>
                </div>
                
                {/* Header Navigation */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold border-b dark:border-gray-700 pb-4 mb-6">Header Navigation</h2>
                    <div className="space-y-3">
                    {(settings.navigation?.headerLinks || []).map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            <div className="grid grid-cols-2 gap-2 flex-grow">
                                <input type="text" placeholder="Link Text" value={link.text} onChange={e => handleHeaderLinkChange(index, 'text', e.target.value)} className="w-full form-input-sm"/>
                                <input type="text" placeholder="URL (e.g., /#packages)" value={link.url} onChange={e => handleHeaderLinkChange(index, 'url', e.target.value)} className="w-full form-input-sm"/>
                            </div>
                            <button type="button" onClick={() => removeHeaderLink(index)} className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ))}
                    </div>
                    <button type="button" onClick={addHeaderLink} className="mt-4 text-sm px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                        + Add Header Link
                    </button>
                </div>

                {/* Contact & CTA */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                     <h2 className="text-2xl font-semibold border-b dark:border-gray-700 pb-4 mb-6">Contact & CTA</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="whatsappNumber">WhatsApp Number</label>
                            <input type="text" name="whatsappNumber" id="whatsappNumber" value={settings.contact?.whatsappNumber || ''} onChange={handleContactChange} className="mt-1 form-input" placeholder="e.g., 6281234567890" />
                            <p className="text-xs text-gray-500 mt-1">Include country code without '+' or '00'.</p>
                        </div>
                         <div>
                            <label htmlFor="whatsappDefaultMessage">WhatsApp Default Message</label>
                            <textarea name="whatsappDefaultMessage" id="whatsappDefaultMessage" value={settings.contact?.whatsappDefaultMessage || ''} onChange={handleContactChange} rows={3} className="mt-1 form-input" />
                        </div>
                     </div>
                </div>

                {/* FIX: Add Packages Page Settings section */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold border-b dark:border-gray-700 pb-4 mb-6">Packages Page Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="packagesPageTitle">Page Title</label>
                            <input type="text" name="title" id="packagesPageTitle" value={settings.packagesPage.title} onChange={handlePackagesPageChange} className="mt-1 form-input" />
                        </div>
                        <div>
                            <label htmlFor="packagesPageSubtitle">Page Subtitle</label>
                            <textarea name="subtitle" id="packagesPageSubtitle" value={settings.packagesPage.subtitle} onChange={handlePackagesPageChange} rows={2} className="mt-1 form-input" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2 mt-4">FAQ Section</h3>
                            <div className="space-y-3">
                            {settings.packagesPage.faq.map((item, index) => (
                                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                    <div className="grid grid-cols-1 gap-2 flex-grow">
                                        <input type="text" placeholder="Question" value={item.q} onChange={e => handleFaqChange(index, 'q', e.target.value)} className="w-full form-input-sm"/>
                                        <textarea placeholder="Answer" value={item.a} onChange={e => handleFaqChange(index, 'a', e.target.value)} rows={2} className="w-full form-input-sm"/>
                                    </div>
                                    <button type="button" onClick={() => removeFaqItem(index)} className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            ))}
                            </div>
                            <button type="button" onClick={addFaqItem} className="mt-4 text-sm px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                                + Add FAQ Item
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Editor */}
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                    <h2 className="text-2xl font-semibold border-b dark:border-gray-700 pb-4">Footer Editor</h2>
                    
                    <div className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="slogan">Company Slogan</label>
                            <textarea name="slogan" id="slogan" value={settings.footer?.slogan || ''} onChange={handleFooterChange} rows={2} className="mt-1 form-input" />
                        </div>
                         <div>
                            <label htmlFor="copyrightName">Copyright Name</label>
                            <input type="text" name="copyrightName" id="copyrightName" value={settings.footer?.copyrightName || ''} onChange={handleFooterChange} className="mt-1 form-input" />
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(settings.footer?.linkColumns || []).map((col, colIndex) => (
                            <div key={colIndex} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">{col.title} Links</h3>
                                <div className="space-y-3">
                                {(col.links || []).map((link, linkIndex) => (
                                    <div key={linkIndex} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                                        <div className="flex-grow">
                                            <input type="text" placeholder="Link Text" value={link.text} onChange={e => handleFooterLinkChange(colIndex, linkIndex, 'text', e.target.value)} className="w-full text-sm form-input-sm"/>
                                            <input type="text" placeholder="URL (e.g., /#packages)" value={link.url} onChange={e => handleFooterLinkChange(colIndex, linkIndex, 'url', e.target.value)} className="w-full text-xs mt-1 form-input-sm"/>
                                        </div>
                                        <button type="button" onClick={() => removeFooterLink(colIndex, linkIndex)} className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                </div>
                                <button type="button" onClick={() => addFooterLink(colIndex)} className="mt-3 text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                                    + Add Link
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                        Save All Settings
                    </button>
                </div>
            </form>
            <style>{`
                label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
                .dark label { color: #d1d5db; }
                .form-input { display: block; width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: .5rem; }
                .dark .form-input { background-color: #374151; border-color: #4b5563; }
                .form-input-sm { padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; }
                .dark .form-input-sm { background-color: #374151; border-color: #4b5563; }
            `}</style>
        </div>
    );
};

export default SiteSettingsPage;
