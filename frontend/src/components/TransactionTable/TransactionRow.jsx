import { formatCurrency } from '../../utils/formatCurrency';
import { FaTrash, FaEdit } from 'react-icons/fa';

const TransactionRow = ({ transaction, onDelete, onEdit }) => {
    const { id, title, amount, type, category, transactionDate } = transaction;

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
                {type === 'INCOME' ? '+' : '-'}{formatCurrency(amount)}
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
