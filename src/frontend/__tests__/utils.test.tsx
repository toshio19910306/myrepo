import React from 'react';
import { render, screen } from '@testing-library/react';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

const TestComponent: React.FC<{ amount: number; date: string; email: string; required: string }> = ({
  amount,
  date,
  email,
  required,
}) => {
  return (
    <div>
      <div data-testid="currency">{formatCurrency(amount)}</div>
      <div data-testid="date">{formatDate(date)}</div>
      <div data-testid="email-valid">{validateEmail(email) ? 'Valid' : 'Invalid'}</div>
      <div data-testid="required-valid">{validateRequired(required) ? 'Valid' : 'Invalid'}</div>
    </div>
  );
};

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    test('formats currency correctly', () => {
      render(<TestComponent amount={1500000} date="2025-01-27" email="test@example.com" required="test" />);
      expect(screen.getByTestId('currency')).toHaveTextContent('￥1,500,000');
    });

    test('formats zero amount', () => {
      render(<TestComponent amount={0} date="2025-01-27" email="test@example.com" required="test" />);
      expect(screen.getByTestId('currency')).toHaveTextContent('￥0');
    });

    test('formats negative amount', () => {
      render(<TestComponent amount={-1000} date="2025-01-27" email="test@example.com" required="test" />);
      expect(screen.getByTestId('currency')).toHaveTextContent('-￥1,000');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      render(<TestComponent amount={1000} date="2025-01-27T00:00:00Z" email="test@example.com" required="test" />);
      expect(screen.getByTestId('date')).toHaveTextContent('2025/1/27');
    });

    test('formats different date', () => {
      render(<TestComponent amount={1000} date="2024-12-31T23:59:59Z" email="test@example.com" required="test" />);
      expect(screen.getByTestId('date')).toHaveTextContent('2024/12/31');
    });
  });

  describe('validateEmail', () => {
    test('validates correct email', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="user@example.com" required="test" />);
      expect(screen.getByTestId('email-valid')).toHaveTextContent('Valid');
    });

    test('invalidates incorrect email', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="invalid-email" required="test" />);
      expect(screen.getByTestId('email-valid')).toHaveTextContent('Invalid');
    });

    test('invalidates empty email', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="" required="test" />);
      expect(screen.getByTestId('email-valid')).toHaveTextContent('Invalid');
    });
  });

  describe('validateRequired', () => {
    test('validates non-empty string', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="test@example.com" required="test value" />);
      expect(screen.getByTestId('required-valid')).toHaveTextContent('Valid');
    });

    test('invalidates empty string', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="test@example.com" required="" />);
      expect(screen.getByTestId('required-valid')).toHaveTextContent('Invalid');
    });

    test('invalidates whitespace-only string', () => {
      render(<TestComponent amount={1000} date="2025-01-27" email="test@example.com" required="   " />);
      expect(screen.getByTestId('required-valid')).toHaveTextContent('Invalid');
    });
  });
});
