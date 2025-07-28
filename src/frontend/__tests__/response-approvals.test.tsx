import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResponseApprovalsPage from '../src/app/response-approvals/page';

const mockFetch = jest.fn();
global.fetch = mockFetch;

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

describe('ResponseApprovalsPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders approvals page with pending responses', async () => {
    const mockApprovals = [
      {
        response_id: 1,
        estimate_number: 'EST-2025-001',
        estimate_price: 1500000,
        vendor_name: '田中太郎',
        request_subject: 'テスト見積依頼',
        status: 'pending',
        submitted_date: '2025-01-27T00:00:00Z',
        current_approver: '承認者',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockApprovals }),
    });

    render(<ResponseApprovalsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('見積回答承認管理')).toBeInTheDocument();
      expect(screen.getByText('EST-2025-001')).toBeInTheDocument();
      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('テスト見積依頼')).toBeInTheDocument();
    });
  });

  test('handles approval action', async () => {
    const mockApprovals = [
      {
        response_id: 1,
        estimate_number: 'EST-2025-001',
        status: 'pending',
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockApprovals }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<ResponseApprovalsPage />);
    
    await waitFor(() => {
      const approveButton = screen.getByText('承認');
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/responses/1/approve'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  test('shows empty state when no pending approvals', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<ResponseApprovalsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('承認待ちの見積回答がありません')).toBeInTheDocument();
    });
  });
});
