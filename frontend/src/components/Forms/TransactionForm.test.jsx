import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionForm from './Transaction';

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    user: { defaultCurrency: 'USD' }
  })
}));

describe('TransactionForm Component', () => {
  const mockSubmit = vi.fn();
  const mockCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('submits correctly with serialized payment method', async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/Title/i), 'Coffee');
    await user.type(screen.getByLabelText(/Amount/i), '5.50');
    await user.selectOptions(screen.getByLabelText(/Payment Method/i), 'Credit Card');
    await user.type(screen.getByLabelText(/Description/i), 'Morning coffee');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /Add Transaction/i }));
    
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    const submittedData = mockSubmit.mock.calls[0][0];
    
    expect(submittedData.title).toBe('Coffee');
    expect(submittedData.amount).toBe(5.5);
    // Verifying that the payment method is serialized into the description correctly
    expect(submittedData.description).toBe('[Credit Card] Morning coffee');
  });

  it('populates initial data correctly when editing', () => {
    const initialData = {
      title: 'Lunch',
      amount: 15,
      currency: 'EUR',
      type: 'EXPENSE',
      category: 'Food',
      transactionDate: '2026-06-15',
      description: '[UPI] Paid for lunch'
    };

    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} initialData={initialData} />);
    
    expect(screen.getByLabelText(/Title/i)).toHaveValue('Lunch');
    expect(screen.getByLabelText(/Amount/i)).toHaveValue(15);
    expect(screen.getByLabelText(/Currency/i)).toHaveValue('EUR');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Paid for lunch'); // Should have parsed out the prefix
    expect(screen.getByLabelText(/Payment Method/i)).toHaveValue('UPI');
    expect(screen.getByRole('button', { name: /Update Transaction/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});
