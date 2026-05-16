import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTransactions from '../../hooks/useTransactions';
import { getTransactionById } from '../../services/transactionService';
import TransactionForm from '../../components/Forms/Transaction';
import Loader from '../../components/Loader/Loader';
import './Transactions.css';

const EditTransaction = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateTransaction } = useTransactions();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const data = await getTransactionById(id);
                setTransaction(data);
            } catch (error) {
                console.error("Error fetching transaction", error);
                navigate('/transactions');
            } finally {
                setLoading(false);
            }
        };
        fetchTransaction();
    }, [id, navigate]);

    const handleSubmit = async (data) => {
        try {
            await updateTransaction(id, data);
            navigate('/transactions');
        } catch (error) {
            console.error("Failed to update transaction", error);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="transactions-page">
            <div className="transactions-header">
                <h1>Edit Transaction</h1>
            </div>
            <div className="transaction-form-card">
                <TransactionForm
                    initialData={transaction}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/transactions')}
                />
            </div>
        </div>
    );
};

export default EditTransaction;
