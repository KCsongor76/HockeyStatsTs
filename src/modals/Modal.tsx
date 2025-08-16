import React from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode[];
    title: string;
}

const Modal = ({isOpen, onClose, children, title}: Props) => {
    if (!isOpen) return null;

    return (
        <div onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>
                <div>
                    <h3>{title}</h3>
                    <button onClick={onClose}>×</button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;