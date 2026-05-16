import { useState } from 'react';

const CategoryForm = ({ onSubmit, onCancel }) => {
    const [categoryName, setCategoryName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (categoryName.trim()) {
            onSubmit(categoryName.trim());
            setCategoryName('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
                <label>New Category Name</label>
                <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    placeholder="e.g. Subscriptions"
                />
            </div>
            <div className="modal-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Category</button>
            </div>
        </form>
    );
};

export default CategoryForm;
