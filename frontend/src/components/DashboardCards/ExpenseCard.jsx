import { formatCurrency } from '../../utils/formatCurrency';

const ExpenseCard = ({ amount }) => {
    return (
        <div className="card card-expense">
            <h3>Total Expense</h3>
            <p className="card-amount">{formatCurrency(amount)}</p>
        </div>
    );
};

export default ExpenseCard;
