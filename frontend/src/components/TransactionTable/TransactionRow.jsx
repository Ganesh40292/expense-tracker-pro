import { formatCurrency, convertCurrency } from '../../utils/formatCurrency';
import useAuth from '../../hooks/useAuth';
import { FaTrash, FaEdit } from 'react-icons/fa';

const TransactionRow = ({ transaction, onDelete, onEdit }) => {
    const { id, title, amount, type, category, transactionDate, currency, baseAmount } = transaction;
    const { user } = useAuth();

    return (
        <tr>
            <td>{transactionDate}</td>
            <td>{title}</td>
            <td>{category}</td>
            <td>
                <span className={`badge badge-${type.toLowerCase()}`}>
                    {type}
                </span>
            </td>
            <td className={`amount-${type.toLowerCase()}`}>
                {type === 'INCOME' ? '+' : '-'}
                {currency?.toUpperCase() === (user?.defaultCurrency || 'INR').toUpperCase() ? (
                    formatCurrency(amount)
                ) : (
                    <>
                        {formatCurrency(convertCurrency(baseAmount, user?.defaultCurrency || 'INR'))}
                        <span className="tx-original-amount" style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px', display: 'block' }}>
                            ({formatCurrency(amount, null, currency)})
                        </span>
                    </>
                )}
            </td>
            <td>
                <div className="action-buttons">
                    <button onClick={() => onEdit(transaction)} className="btn-icon btn-edit" title="Edit">
                        <FaEdit />
                    </button>
                    <button onClick={() => onDelete(id)} className="btn-icon btn-delete" title="Delete">
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default TransactionRow;
