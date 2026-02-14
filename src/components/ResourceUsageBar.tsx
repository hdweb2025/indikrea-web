import React from 'react';

interface ResourceUsageBarProps {
    current: number;
    limit: number;
    label: string;
    unit: string;
}

const ResourceUsageBar: React.FC<ResourceUsageBarProps> = ({ current, limit, label, unit }) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    
    let barColor = 'bg-primary-500';
    if (percentage > 95) {
        barColor = 'bg-red-500';
    } else if (percentage > 80) {
        barColor = 'bg-yellow-500';
    }

    const formatValue = (val: number) => {
        return val.toLocaleString('en-US');
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatValue(current)} / {formatValue(limit)} {unit}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                    className={`${barColor} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ResourceUsageBar;