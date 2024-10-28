import React from 'react';
import styles from '@/styles/RLConfig.module.css';

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
        <div className={styles.sliderContainer}>
            <div className={styles.sliderTrack}>
                <div
                    className={styles.sliderFill}
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
                className={styles.sliderInput}
            />
            <div
                className={styles.sliderThumb}
                style={{ left: `calc(${percentage}% - 12px)` }}
            />
        </div>
    );
};