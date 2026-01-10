import React, {SelectHTMLAttributes} from 'react';
import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    label: string;
    error?: string;
    options: { value: string | number; label: string }[];
    hideLabel?: boolean;
}

const Select: React.FC<SelectProps> = ({id, label, error, options, hideLabel, className, ...props}) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            <label
                htmlFor={id}
                className={hideLabel ? styles.hiddenLabel : styles.label}
            >
                {label}
            </label>
            <select
                id={id}
                className={styles.select}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};

export default Select;