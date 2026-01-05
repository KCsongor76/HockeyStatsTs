import React, {InputHTMLAttributes} from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string;
    hideLabel?: boolean;
}

const Input: React.FC<InputProps> = ({id, label, error, hideLabel, className, ...props}) => {
    return (
        <div className={`input-group ${className || ''}`}>
            <label
                htmlFor={id}
            >
                {label}
            </label>
            <input
                id={id}
                {...props}
            />
            {error && <span>{error}</span>}
        </div>
    );
};

export default Input;