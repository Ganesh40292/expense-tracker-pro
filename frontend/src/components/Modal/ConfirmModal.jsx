import './Modal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="btn-primary btn-danger-action">Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
