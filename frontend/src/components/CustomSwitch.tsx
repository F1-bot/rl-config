import React from 'react';
import styles from '@/styles/RLConfig.module.css';

interface CustomSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label: string;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
                                                              checked,
                                                              onChange,
                                                              disabled = false,
                                                              label
                                                          }) => {
    return (
        <div className={styles.switchContainer}>
            <label className={styles.switchLabel}>
                <div className={styles.switchTrack}>
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={disabled}
                        className={styles.switchInput}
                    />
                    <div className={styles.switchTrack}>
                        <div className={styles.switchToggle}/>
                    </div>
                </div>
                <span className={styles.switchText}>{label}</span>
            </label>
        </div>
    );
};