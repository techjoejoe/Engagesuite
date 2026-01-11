import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const Icons = {
    Fire: ({ className = "w-6 h-6", ...props }: IconProps) => (
        <svg className={className} style={{ width: '24px', height: '24px', ...props.style }} fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.333 1.167-4.5 3.5-6.5.5-.429 1.167-.071 1.167.571v1.786c0 .571.5 1.143 1.083 1.143.334 0 .667-.143.917-.429C13.5 10.5 14 8.5 14 6c0-2.5-1-4.5-3-6 3 1 6 4 6 9 0 .5 0 1-.083 1.5C18.667 14 20 17 20 19c0 2.5-3.134 4-8 4z" />
        </svg>
    ),
    Trophy: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M12 2C9.243 2 7 4.243 7 7v1H4a1 1 0 00-1 1v2c0 2.206 1.794 4 4 4h.535A6.005 6.005 0 0011 17.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A6.005 6.005 0 0016.465 15H17c2.206 0 4-1.794 4-4V9a1 1 0 00-1-1h-3V7c0-2.757-2.243-5-5-5zM5 11V10h2v3.111A2.003 2.003 0 015 11zm14 0a2.003 2.003 0 01-2 2.111V10h2v1z" />
        </svg>
    ),
    Camera: ({ className = "w-6 h-6", ...props }: IconProps) => (
        <svg className={className} style={{ width: '24px', height: '24px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Heart: ({ filled, className = "w-5 h-5", ...props }: IconProps & { filled?: boolean }) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    Settings: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Plus: ({ className = "w-6 h-6", ...props }: IconProps) => (
        <svg className={className} style={{ width: '24px', height: '24px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    Back: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    ),
    Upload: ({ className = "w-8 h-8", ...props }: IconProps) => (
        <svg className={className} style={{ width: '32px', height: '32px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    ),
    Clock: ({ className = "w-4 h-4", ...props }: IconProps) => (
        <svg className={className} style={{ width: '16px', height: '16px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Trash: ({ className = "w-4 h-4", ...props }: IconProps) => (
        <svg className={className} style={{ width: '16px', height: '16px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    Copy: ({ className = "w-4 h-4", ...props }: IconProps) => (
        <svg className={className} style={{ width: '16px', height: '16px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    Check: ({ className = "w-4 h-4", ...props }: IconProps) => (
        <svg className={className} style={{ width: '16px', height: '16px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    Key: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
    ),
    Refresh: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    Pause: ({ className = "w-6 h-6", ...props }: IconProps) => (
        <svg className={className} style={{ width: '24px', height: '24px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Play: ({ className = "w-6 h-6", ...props }: IconProps) => (
        <svg className={className} style={{ width: '24px', height: '24px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Edit: ({ className = "w-4 h-4", ...props }: IconProps) => (
        <svg className={className} style={{ width: '16px', height: '16px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    Close: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    ChevronRight: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    ),
    Download: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
    ),
    X: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    Eye: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    EyeOff: ({ className = "w-5 h-5", ...props }: IconProps) => (
        <svg className={className} style={{ width: '20px', height: '20px', ...props.style }} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    )
};
