import { useState, useEffect } from 'react';
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

const TransactionForm = ({ onSubmit, initialData = null, onCancel }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        title: '',
        amount: '',
        currency: user?.defaultCurrency || 'INR',
        type: 'EXPENSE',
        category: CATEGORIES[0],
        transactionDate: new Date().toISOString().split('T')[0],
        description: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        if (initialData) {
            let cleanDesc = initialData.description || '';
            let pm = 'Cash';
            
            if (cleanDesc) {
                const match = cleanDesc.match(/^\[(Cash|UPI|Credit Card|Debit Card|Bank Transfer|Wallet)\]\s*(.*)/i);
                if (match) {
                    pm = match[1];
                    cleanDesc = match[2];
                }
            }
            
            setForm({
                ...initialData,
                description: cleanDesc
            });
            setPaymentMethod(pm);
        } else if (user?.defaultCurrency) {
            setForm(prev => ({
                ...prev,
                currency: prev.currency || user.defaultCurrency
            }));
        }
    }, [initialData, user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Serialize paymentMethod by prefixing the description field
        const prefix = `[${paymentMethod}] `;
        const serializedDescription = form.description ? prefix + form.description.trim() : `[${paymentMethod}]`;
        
        onSubmit({ 
            ...form, 
            description: serializedDescription, 
            amount: parseFloat(form.amount) 
        });
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
                <div className="form-group" style={{ flex: 2 }}>
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
                <div className="form-group" style={{ flex: 1.5 }}>
                    <label>Currency</label>
                    <select name="currency" value={form.currency} onChange={handleChange}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="AED">AED (د.إ)</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
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
                    <label>Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        {['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet'].map(pm => (
                            <option key={pm} value={pm}>{pm}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-row">
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
                <div className="form-group">
                    <label>Description (Notes)</label>
                    <input
                        name="description"
                        type="text"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Details or notes about transaction"
                    />
                </div>
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
