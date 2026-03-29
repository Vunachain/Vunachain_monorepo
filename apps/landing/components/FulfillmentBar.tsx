import React from 'react';

interface FulfillmentBarProps {
    actual_volume: number;
    target_volume: number;
    status: string;
    deadline?: string;
}

const FulfillmentBar: React.FC<FulfillmentBarProps> = ({ actual_volume, target_volume, status, deadline }) => {
    const isCompleted = status === 'COMPLETED';
    const percent = Math.min(100, Math.max(0, (actual_volume / target_volume) * 100)) || 0;

    let progressColor = 'bg-blue-500'; /* Default for ACTIVE */
    let bgColor = 'bg-blue-100 dark:bg-blue-900/30';
    let textColor = 'text-blue-700 dark:text-blue-400';

    if (isCompleted || percent >= 100) {
        progressColor = 'bg-green-500';
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-700 dark:text-green-400';
    } else if (status === 'EXPIRED') {
        progressColor = 'bg-red-500';
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-700 dark:text-red-400';
    } else if (status === 'OPEN') {
        progressColor = 'bg-amber-400';
        bgColor = 'bg-amber-100 dark:bg-amber-900/30';
        textColor = 'text-amber-700 dark:text-amber-400';
    }

    return (
        <div className="w-full mt-4">
            <div className="flex justify-between items-end mb-2">
                <p className={`text-xs font-bold uppercase tracking-widest ${textColor}`}>
                    Fulfillment Progress
                </p>
                <div className="text-right">
                    <p className={`text-sm font-black ${textColor}`}>
                        {actual_volume.toLocaleString()} / {target_volume.toLocaleString()} kg
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {percent.toFixed(1)}% COMPLETE
                    </p>
                </div>
            </div>
            
            <div className={`w-full h-3 rounded-full overflow-hidden ${bgColor}`}>
                <div 
                    className={`h-full ${progressColor} transition-all duration-1000 ease-out`} 
                    style={{ width: `${percent}%` }}
                ></div>
            </div>
            
            {deadline && (
                <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Deadline: {new Date(deadline).toLocaleDateString()}
                    </p>
                    {percent < 100 && status === 'ACTIVE' && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            {(target_volume - actual_volume).toLocaleString()}kg Remaining
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FulfillmentBar;
