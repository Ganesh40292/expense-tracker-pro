import { formatCurrency } from '../../utils/formatCurrency';

const IncomeCard = ({ amount }) => {
    return (
        <div className="card card-income">
            <h3>Total Income</h3>
            <p className="card-amount">{formatCurrency(amount)}</p>
        </div>
    );
};

export default IncomeCard;
