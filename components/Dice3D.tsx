import React from 'react';

interface Dice3DProps {
    value: number;
    rolling: boolean;
    size?: number;
}

export default function Dice3D({ value, rolling, size = 100 }: Dice3DProps) {
    const halfSize = size / 2;
    const dotSize = size / 5;

    // Map values to rotation angles
    const rotations: Record<number, string> = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateX(-90deg) rotateY(0deg)',
        3: 'rotateY(-90deg)', // Fixed rotation axis
        4: 'rotateY(90deg)',
        5: 'rotateX(90deg) rotateY(0deg)',
        6: 'rotateX(180deg) rotateY(0deg)',
    };

    // Random rotation for rolling animation
    // We use a ref or stable value if we want it to be continuous, but for now random is fine
    // However, if it re-renders during rolling, it might jitter.
    // But the parent controls 'rolling' state.

    return (
        <div
            className="scene inline-block"
            style={{
                width: size,
                height: size,
                perspective: size * 3
            }}
        >
            <div
                className={`cube relative w-full h-full transition-transform duration-[600ms] ease-out`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: rolling
                        ? `rotateX(${Math.random() * 720 + 360}deg) rotateY(${Math.random() * 720 + 360}deg)`
                        : rotations[value],
                }}
            >
                {/* Common Face Styles */}
                {[
                    { val: 1, trans: `rotateY(0deg) translateZ(${halfSize}px)` },
                    { val: 2, trans: `rotateX(90deg) translateZ(${halfSize}px)` },
                    { val: 3, trans: `rotateY(90deg) translateZ(${halfSize}px)` },
                    { val: 4, trans: `rotateY(-90deg) translateZ(${halfSize}px)` },
                    { val: 5, trans: `rotateX(-90deg) translateZ(${halfSize}px)` },
                    { val: 6, trans: `rotateX(180deg) translateZ(${halfSize}px)` },
                ].map((face) => (
                    <div
                        key={face.val}
                        className="absolute w-full h-full bg-white border border-gray-300 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] flex justify-center items-center backface-hidden"
                        style={{
                            transform: face.trans,
                            backfaceVisibility: 'hidden'
                        }}
                    >
                        {/* Render Dots */}
                        <DiceFace value={face.val} dotSize={dotSize} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function DiceFace({ value, dotSize }: { value: number, dotSize: number }) {
    const Dot = () => (
        <div
            className="bg-black rounded-full shadow-sm"
            style={{ width: dotSize, height: dotSize }}
        />
    );

    const containerStyle = "w-full h-full p-[15%] flex justify-between";

    switch (value) {
        case 1:
            return <div className="flex items-center justify-center w-full h-full"><Dot /></div>;
        case 2:
            return (
                <div className={containerStyle}>
                    <div className="self-start"><Dot /></div>
                    <div className="self-end"><Dot /></div>
                </div>
            );
        case 3:
            return (
                <div className={containerStyle}>
                    <div className="self-start"><Dot /></div>
                    <div className="self-center"><Dot /></div>
                    <div className="self-end"><Dot /></div>
                </div>
            );
        case 4:
            return (
                <div className="w-full h-full p-[15%] flex justify-between">
                    <div className="flex flex-col justify-between"><Dot /><Dot /></div>
                    <div className="flex flex-col justify-between"><Dot /><Dot /></div>
                </div>
            );
        case 5:
            return (
                <div className="w-full h-full p-[15%] flex justify-between">
                    <div className="flex flex-col justify-between"><Dot /><Dot /></div>
                    <div className="self-center"><Dot /></div>
                    <div className="flex flex-col justify-between"><Dot /><Dot /></div>
                </div>
            );
        case 6:
            return (
                <div className="w-full h-full p-[15%] flex justify-between">
                    <div className="flex flex-col justify-between"><Dot /><Dot /><Dot /></div>
                    <div className="flex flex-col justify-between"><Dot /><Dot /><Dot /></div>
                </div>
            );
        default:
            return null;
    }
}
