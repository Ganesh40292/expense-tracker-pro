const SecondaryButton = ({ children, onClick, type = "button", disabled = false, className = "" }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn-secondary ${className}`}
        >
            {children}
        </button>
    );
};

export default SecondaryButton;
