import { formatCurrency } from '../../utils/formatCurrency';

const BalanceCard = ({ amount }) => {
    return (
        <div className="card card-balance">
            <h3>Net Balance</h3>
            <p className="card-amount">{formatCurrency(amount)}</p>
        </div>
    );
};

export default BalanceCard;
