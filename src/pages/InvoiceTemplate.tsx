import React, { useState, useEffect } from 'react';
import { mockInvoiceTemplate, InvoiceTemplate } from '../data/mockData';
import { usePublicData } from '../contexts/PublicDataContext';
import { API_BASE_URL } from '../utils/api';

const InvoiceTemplatePage: React.FC = () => {
    const { settings } = usePublicData();
    const [template, setTemplate] = useState<InvoiceTemplate>(mockInvoiceTemplate);

    useEffect(() => {
        if (settings && settings.invoiceTemplate) {
            setTemplate(prev => ({
                ...prev,
                ...settings.invoiceTemplate,
                companyName: settings.company.companyName,
                companyAddress: settings.company.companyAddress,
                companyEmail: settings.company.companyEmail,
                companyPhone: settings.company.companyPhone,
                companyLogo: settings.company.companyLogo,
            }));
        }
    }, [settings]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTemplate(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplate(prev => ({ ...prev, companyLogo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSignatureImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplate(prev => ({ ...prev, signatureImage: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const removeSignatureImage = () => {
        setTemplate(prev => ({ ...prev, signatureImage: null }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Map template fields to DB setting keys
            // Note: companyName etc. are mapped to global company settings
            // But here we might want to store them as invoice specific settings if they differ?
            // For now, let's assume editing here updates the global company settings too.
            
            const payload = {
                // Global Company Settings
                companyName: template.companyName,
                companyAddress: template.companyAddress,
                companyEmail: template.companyEmail,
                companyPhone: template.companyPhone,
                companyLogo: template.companyLogo,
                
                // Invoice Specific Settings
                inv_openingText: template.openingText,
                inv_closingText: template.closingText,
                inv_paymentInfo: template.paymentInfo,
                inv_signatureImage: template.signatureImage,
                inv_signatureName: template.signatureName,
                inv_signatureTitle: template.signatureTitle,
            };

            const userStr = localStorage.getItem('user');
            if (!userStr) {
                alert('You must be logged in to save settings.');
                return;
            }
            const user = JSON.parse(userStr);

            const response = await fetch(`${API_BASE_URL}/update_data.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_settings',
                    user: user,
                    payload: payload
                })
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Invoice template saved successfully!');
                // We could reload page or trigger context refresh if available
                window.location.reload(); 
            } else {
                alert('Failed to save: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Error saving template. Check console for details.');
        }
    };
    
    const formStyle = `
        .form-input { display: block; width: 100%; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: .5rem; }
        .dark .form-input { background-color: #374151; border-color: #4b5563; color: #d1d5db; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #06b6d4; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.5); }
    `;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Invoice Template Editor</h1>
            <p className="text-gray-500 dark:text-gray-400">Customize the look and content of all generated PDF invoices.</p>

            <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 space-y-8">

                    {/* Header / KOP */}
                    <div className="border-b dark:border-gray-700 pb-6">
                        <h2 className="text-xl font-semibold mb-4">Header / KOP</h2>
                        <div className="flex items-start gap-6">
                             <div>
                                <span className="block text-sm font-medium mb-2">Company Logo</span>
                                {template.companyLogo ? (
                                    <img src={template.companyLogo} alt="Logo" className="h-20 w-20 object-contain rounded-md bg-gray-100 dark:bg-gray-700 p-1" />
                                ) : (
                                    <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                        <i className="fas fa-image text-3xl text-gray-400"></i>
                                    </div>
                                )}
                                <label htmlFor="logo-upload" className="mt-2 text-sm text-primary-600 hover:text-primary-500 cursor-pointer">
                                    Change Logo
                                </label>
                                <input type="file" id="logo-upload" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoChange} />
                            </div>
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="companyName">Company Name</label>
                                    <input type="text" name="companyName" value={template.companyName} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                                <div>
                                    <label htmlFor="companyAddress">Address</label>
                                    <input type="text" name="companyAddress" value={template.companyAddress} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                                <div>
                                    <label htmlFor="companyEmail">Email</label>
                                    <input type="email" name="companyEmail" value={template.companyEmail} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                                <div>
                                    <label htmlFor="companyPhone">Phone</label>
                                    <input type="tel" name="companyPhone" value={template.companyPhone} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Body */}
                     <div className="border-b dark:border-gray-700 pb-6">
                        <h2 className="text-xl font-semibold mb-4">Invoice Body</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="openingText">Opening Text</label>
                                <textarea name="openingText" rows={3} value={template.openingText} onChange={handleInputChange} className="mt-1 form-input"></textarea>
                                <p className="text-xs text-gray-500 mt-1">This text appears before the invoice items table.</p>
                            </div>
                             <div>
                                <label htmlFor="closingText">Closing Text</label>
                                <textarea name="closingText" rows={2} value={template.closingText} onChange={handleInputChange} className="mt-1 form-input"></textarea>
                                <p className="text-xs text-gray-500 mt-1">This text appears after the totals, before payment info.</p>
                            </div>
                        </div>
                     </div>
                     
                     {/* Footer */}
                     <div>
                        <h2 className="text-xl font-semibold mb-4">Footer</h2>
                         <div className="space-y-6">
                             <div>
                                <label htmlFor="paymentInfo">Payment Information</label>
                                <textarea name="paymentInfo" rows={4} value={template.paymentInfo} onChange={handleInputChange} className="mt-1 form-input" placeholder="e.g., Bank Name, Account Number..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Signature Image (Scan/QR)</label>
                                <div className="flex items-center gap-4">
                                    {template.signatureImage ? (
                                        <img src={template.signatureImage} alt="Signature" className="h-24 w-auto object-contain rounded-md bg-gray-100 dark:bg-gray-700 p-1 border dark:border-gray-600" />
                                    ) : (
                                        <div className="h-24 w-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                            <i className="fas fa-signature text-3xl text-gray-400"></i>
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="signature-upload" className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer">
                                            Upload Image
                                        </label>
                                        <input type="file" id="signature-upload" accept="image/png, image/jpeg" className="hidden" onChange={handleSignatureImageChange} />
                                        {template.signatureImage && (
                                            <button type="button" onClick={removeSignatureImage} className="ml-2 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Upload a transparent PNG for best results.</p>
                            </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div>
                                    <label htmlFor="signatureName">Signature Name</label>
                                    <input type="text" name="signatureName" value={template.signatureName} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                                <div>
                                    <label htmlFor="signatureTitle">Signature Title</label>
                                    <input type="text" name="signatureTitle" value={template.signatureTitle} onChange={handleInputChange} className="mt-1 form-input"/>
                                </div>
                             </div>
                         </div>
                     </div>
                </div>
                 <div className="flex justify-end pt-6">
                    <button type="submit" className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        Save Template
                    </button>
                </div>
            </form>
            <style>{formStyle}</style>
        </div>
    );
};

export default InvoiceTemplatePage;
