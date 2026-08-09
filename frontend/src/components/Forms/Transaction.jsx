import { useState } from 'react';
import { CATEGORIES, TRANSACTION_TYPES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

function parseInitialForm(initialData, user) {
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
        return {
            form: { ...initialData, description: cleanDesc },
            pm
        };
    }
    return {
        form: {
            title: '',
            amount: '',
            currency: user?.defaultCurrency || 'INR',
            type: 'EXPENSE',
            category: CATEGORIES[0],
            transactionDate: new Date().toISOString().split('T')[0],
            description: '',
        },
        pm: 'Cash'
    };
}

const TransactionForm = ({ onSubmit, initialData = null, onCancel }) => {
    const { user } = useAuth();
    const initialState = parseInitialForm(initialData, user);
    const [form, setForm] = useState(initialState.form);
    const [paymentMethod, setPaymentMethod] = useState(initialState.pm);

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
                <label htmlFor="tx-title">Title</label>
                <input
                    id="tx-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="tx-amount">Amount</label>
                    <input
                        id="tx-amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        value={form.amount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group" style={{ flex: 1.5 }}>
                    <label htmlFor="tx-currency">Currency</label>
                    <select id="tx-currency" name="currency" value={form.currency} onChange={handleChange}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="AED">AED (د.إ)</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="tx-type">Type</label>
                    <select id="tx-type" name="type" value={form.type} onChange={handleChange}>
                        <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
                        <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="tx-category">Category</label>
                    <select id="tx-category" name="category" value={form.category} onChange={handleChange}>
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="tx-payment-method">Payment Method</label>
                    <select id="tx-payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        {['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet'].map(pm => (
                            <option key={pm} value={pm}>{pm}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="tx-date">Date</label>
                    <input
                        id="tx-date"
                        name="transactionDate"
                        type="date"
                        value={form.transactionDate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="tx-description">Description (Notes)</label>
                    <input
                        id="tx-description"
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
