import React from 'react';
import { usePublicData } from '../contexts/PublicDataContext';

const WhatsAppCTA: React.FC = () => {
    const { settings } = usePublicData();
    const whatsappNumber = settings?.contact?.whatsappNumber;
    const whatsappDefaultMessage = settings?.contact?.whatsappDefaultMessage;

    if (!whatsappNumber) {
        return null; // Don't render if number is not set
    }
    
    const message = encodeURIComponent(whatsappDefaultMessage || '');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 z-30"
            title="Hubungi kami di WhatsApp"
        >
            <i className="fab fa-whatsapp text-4xl"></i>
        </a>
    );
};

export default WhatsAppCTA;
