import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock the API services and hooks
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { name: 'Test User', defaultCurrency: 'INR' }
  })
}));

vi.mock('../../hooks/useTheme', () => ({
  default: () => ({
    theme: 'light',
    toggleTheme: vi.fn()
  })
}));

vi.mock('../../hooks/useTransactions', () => ({
  default: () => ({
    transactions: [
      { id: 1, title: 'Groceries', amount: 50, type: 'EXPENSE', category: 'Food', transactionDate: '2026-06-15', baseAmount: 50, currency: 'INR' },
      { id: 2, title: 'Salary', amount: 5000, type: 'INCOME', category: 'Salary', transactionDate: '2026-06-01', baseAmount: 5000, currency: 'INR' }
    ],
    loading: false,
    fetchTransactions: vi.fn()
  })
}));

vi.mock('../../hooks/useRecurringExpenses', () => ({
  default: () => ({
    recurringExpenses: [],
    fetchRecurringExpenses: vi.fn()
  })
}));

describe('Dashboard Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
  };

  it('renders dashboard headers correctly', () => {
    renderDashboard();
    
    // Check if the dashboard title appears
    expect(screen.getByText(/Fintech Analytics/i)).toBeInTheDocument();
  });

  it('displays transaction data in stat cards', () => {
    renderDashboard();

    // Verify formatCurrency correctly rendered amounts (it might add comma and currency symbol)
    // Here we'll just check for numeric fragments since format currency usually outputs '5,000'
    const incomeValue = screen.getAllByText(/5,000/)[0];
    const expenseValue = screen.getAllByText(/50/)[0];

    expect(incomeValue).toBeInTheDocument();
    expect(expenseValue).toBeInTheDocument();
  });
});
