import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../src/components/navigation';

jest.mock('next/navigation', () => ({
  usePathname: () => '/responses',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('../src/contexts/UserContext', () => ({
  useUser: () => ({
    user: {
      user_id: 1,
      username: 'testuser',
      email: 'test@example.com',
      user_type: 'ADMIN',
    },
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}));

describe('Navigation', () => {
  test('renders all navigation tabs', () => {
    render(<Navigation />);
    
    expect(screen.getByText('見積依頼')).toBeInTheDocument();
    expect(screen.getByText('見積回答')).toBeInTheDocument();
    expect(screen.getByText('見積回答承認管理')).toBeInTheDocument();
    expect(screen.getByText('ベンダー管理')).toBeInTheDocument();
  });

  test('highlights active tab', () => {
    render(<Navigation />);
    
    const activeTab = screen.getByText('見積回答').closest('a');
    expect(activeTab).toHaveClass('bg-primary');
  });

  test('renders system title', () => {
    render(<Navigation />);
    
    expect(screen.getByText('見積依頼システム')).toBeInTheDocument();
  });
});
