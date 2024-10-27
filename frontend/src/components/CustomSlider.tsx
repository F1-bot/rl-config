import React from 'react';

interface CustomSliderProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    disabled?: boolean;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
                                                              value,
                                                              onChange,
                                                              min,
                                                              max,
                                                              step,
                                                              disabled = false
                                                          }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative w-full h-6 flex items-center">
            <div className="absolute w-full h-2 bg-gray-200 rounded-full">
                <div
                    className="absolute h-full bg-blue-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <input
                type="range"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="absolute w-full h-2 opacity-0 cursor-pointer"
            />
            <div
                className="absolute w-4 h-4 bg-white border-6 border-blue-500 rounded-full shadow-md"
                style={{ left: `calc(${percentage}% - 0.5rem)` }}
            />
        </div>
    );
};