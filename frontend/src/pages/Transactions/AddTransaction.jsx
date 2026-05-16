import { useNavigate } from 'react-router-dom';
import useTransactions from '../../hooks/useTransactions';
import TransactionForm from '../../components/Forms/Transaction';
import './Transactions.css';

const AddTransaction = () => {
    const { addTransaction } = useTransactions();
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await addTransaction(data);
            navigate('/transactions');
        } catch (error) {
            console.error("Failed to add transaction", error);
        }
    };

    return (
        <div className="transactions-page">
            <div className="transactions-header">
                <h1>Add New Transaction</h1>
            </div>
            <div className="transaction-form-card">
                <TransactionForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/transactions')}
                />
            </div>
        </div>
    );
};

export default AddTransaction;
