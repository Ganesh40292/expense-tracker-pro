import { useState, useEffect } from 'react';
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants';

const TransactionForm = ({ onSubmit, initialData = null, onCancel }) => {
    const [form, setForm] = useState({
        title: '',
        amount: '',
        type: 'EXPENSE',
        category: CATEGORIES[0],
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setForm(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...form, amount: parseFloat(form.amount) });
    };

    return (
        <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-group">
                <label>Title</label>
                <input
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Amount</label>
                    <input
                        name="amount"
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Type</label>
                    <select name="type" value={form.type} onChange={handleChange}>
                        <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
                        <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Date</label>
                    <input
                        name="transactionDate"
                        type="date"
                        value={form.transactionDate}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>
            <div className="form-group">
                <label>Description</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                />
            </div>
            <div className="modal-actions">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                    {initialData ? 'Update' : 'Add'} Transaction
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
