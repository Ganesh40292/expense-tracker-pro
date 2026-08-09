import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Global ResizeObserver mock for JSDOM
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    motion: new Proxy(
      {},
      {
        get: () => {
          return ({ children, className, style, onClick }) => (
            <div className={className} style={style} onClick={onClick}>
              {children}
            </div>
          );
        },
      }
    ),
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useSpring: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => 0,
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock hooks & contexts
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { name: 'Test User', defaultCurrency: 'INR' },
  }),
}));

vi.mock('../../hooks/useTheme', () => ({
  default: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../../hooks/useTransactions', () => ({
  default: () => ({
    transactions: [
      { id: 1, title: 'Groceries', amount: 50, type: 'EXPENSE', category: 'Food', transactionDate: '2026-06-15', baseAmount: 50, currency: 'INR' },
      { id: 2, title: 'Salary', amount: 5000, type: 'INCOME', category: 'Salary', transactionDate: '2026-06-01', baseAmount: 5000, currency: 'INR' },
    ],
    loading: false,
    fetchTransactions: vi.fn(),
  }),
}));

vi.mock('../../hooks/useFilteredTransactions', () => ({
  useFilteredTransactions: (txs) => ({
    filteredTransactions: txs || [],
    setDateRange: vi.fn(),
    dateRange: 'ALL',
    searchQuery: '',
    setSearchQuery: vi.fn(),
    selectedCategories: [],
    setSelectedCategories: vi.fn(),
    minAmount: '',
    setMinAmount: vi.fn(),
    maxAmount: '',
    setMaxAmount: vi.fn(),
    sortBy: 'LATEST',
    setSortBy: vi.fn(),
    resetFilters: vi.fn(),
    activeFilterCount: 0,
  }),
}));

vi.mock('../../hooks/useRecurringExpenses', () => ({
  default: () => ({
    recurringExpenses: [],
    fetchRecurringExpenses: vi.fn(),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../../context/CurrencyContext', () => ({
  useCurrency: () => ({
    currency: 'INR',
    formatCurrency: (val) => `₹${val}`,
  }),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// Mock complex visualization & child components for JSDOM environment
vi.mock('../../components/Charts/PieChartComponent', () => ({ default: () => <div data-testid="pie-chart" /> }));
vi.mock('../../components/Charts/LineChartComponent', () => ({ default: () => <div data-testid="line-chart" /> }));
vi.mock('../../components/Charts/BubbleChartComponent', () => ({ default: () => <div data-testid="bubble-chart" /> }));
vi.mock('../../components/Charts/BarChartComponent', () => ({ default: () => <div data-testid="bar-chart" /> }));
vi.mock('../../components/HealthScore/HealthScoreGauge', () => ({ default: () => <div data-testid="health-score" /> }));
vi.mock('../../components/BillCalendar/BillCalendar', () => ({ default: () => <div data-testid="bill-calendar" /> }));
vi.mock('../../components/ExportCenter/ExportCenter', () => ({ default: () => <div data-testid="export-center" /> }));
vi.mock('../../components/AdvancedFilterPanel/AdvancedFilterPanel', () => ({ default: () => <div data-testid="filter-panel" /> }));
vi.mock('../../components/AnimatedCounter/AnimatedCounter', () => ({ default: ({ value }) => <span>{value}</span> }));

describe('Dashboard Component Unit Tests', () => {
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
    expect(screen.getByText(/Expense Dashboard/i)).toBeInTheDocument();
  });

  it('displays user greeting in dashboard', () => {
    renderDashboard();
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });
});
