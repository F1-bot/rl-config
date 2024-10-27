import React from 'react';

interface CustomSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
                                                              checked,
                                                              onChange,
                                                              disabled = false
                                                          }) => {
    return (
        <div className="flex items-center">
            <div
                className={`
                    relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out
                    ${disabled
                    ? 'cursor-not-allowed bg-gray-200'
                    : 'cursor-pointer ' + (checked ? 'bg-blue-500' : 'bg-gray-200')}
                `}
                onClick={() => !disabled && onChange(!checked)}
            >
                <div
                    className={`
                        absolute w-6 h-6 rounded-full shadow-md transition-transform duration-200 ease-in-out
                        ${checked ? 'translate-x-7' : 'translate-x-1'}
                    `}
                    style={{
                        top: '2px',
                        backgroundColor: disabled ? '#F3F4F6' : 'white',
                        border: '5px solid',
                        borderColor: checked ? '#3B82F6' : '#E5E7EB'
                    }}
                />
            </div>
        </div>
    );
};