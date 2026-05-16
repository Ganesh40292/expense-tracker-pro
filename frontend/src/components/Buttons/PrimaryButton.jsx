const PrimaryButton = ({ children, onClick, type = "button", disabled = false, className = "" }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn-primary ${className}`}
        >
            {children}
        </button>
    );
};

export default PrimaryButton;
