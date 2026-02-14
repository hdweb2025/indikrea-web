import React from 'react';

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center space-x-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl ${color}`}>
                <i className={icon}></i>
            </div>
            <div>
                <p className="text-4xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    );
};

export default StatCard;