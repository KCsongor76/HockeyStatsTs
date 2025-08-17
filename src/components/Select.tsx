import React from 'react';
import styles from './Select.module.css';

interface Option {
    value: string | number;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: Option[];
    placeholder?: string;
    required?: boolean;
    name?: string;
    id?: string;
    className?: string;
    error?: string;
}

const Select: React.FC<SelectProps> = ({
                                           label,
                                           value,
                                           onChange,
                                           options,
                                           placeholder,
                                           required = false,
                                           name,
                                           id,
                                           className = '',
                                           error
                                       }) => {
    const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`${styles.selectContainer} ${className}`}>
            {label && (
                <label htmlFor={selectId} className={styles.label}>
                    {label}
                </label>
            )}
            <select
                id={selectId}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`${styles.select} ${error ? styles.error : ''}`}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Select;