import React, {SelectHTMLAttributes} from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    id: string;
    label: string;
    error?: string;
    options: { value: string | number; label: string }[];
    hideLabel?: boolean;
}

const Select: React.FC<SelectProps> = ({id, label, error, options, hideLabel, className, ...props}) => {
    return (
        <div>
            <label
                htmlFor={id}
            >
                {label}
            </label>
            <select
                id={id}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <span>{error}</span>}
        </div>
    );
};

export default Select;