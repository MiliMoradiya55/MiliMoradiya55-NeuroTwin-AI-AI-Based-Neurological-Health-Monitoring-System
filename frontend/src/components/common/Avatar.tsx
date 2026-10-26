import React from 'react';

interface AvatarProps {
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ className = '' }) => {
    return (
        <div className={`p-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm ${className}`}>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">Avatar</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                This component has been automatically generated and is ready for implementation.
            </p>
        </div>
    );
};

export default Avatar;
