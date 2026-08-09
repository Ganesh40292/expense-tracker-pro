import IncomeCard from './IncomeCard';
import ExpenseCard from './ExpenseCard';
import BalanceCard from './BalanceCard';

const DashboardCards = ({ data }) => {
    return (
        <div className="dashboard-cards">
            <IncomeCard amount={data?.totalIncome || 0} />
            <ExpenseCard amount={data?.totalExpense || 0} />
            <BalanceCard amount={data?.balance || 0} />
            <div className="card card-count">
                <h3>Transactions</h3>
                <p className="card-amount">{data?.transactionCount || 0}</p>
            </div>
        </div>
    );
};

export default DashboardCards;
