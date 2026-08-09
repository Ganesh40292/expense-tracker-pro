import TransactionRow from './TransactionRow';
import './TransactionTable.css';

const TransactionTable = ({ transactions, onDelete, onEdit }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="empty-state">
                <p>No transactions found.</p>
            </div>
        );
    }

    return (
        <div className="transactions-table-wrapper">
            <table className="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                        <TransactionRow
                            key={transaction.id}
                            transaction={transaction}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionTable;
