import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewResponsePage from '../src/app/responses/new/page';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('NewResponsePage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders new response form', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<NewResponsePage />);
    
    await waitFor(() => {
      expect(screen.getByText('見積回答作成')).toBeInTheDocument();
      expect(screen.getByText('承認済みの見積依頼に対する回答を作成します')).toBeInTheDocument();
    });
  });

  test('loads approved requests and vendors', async () => {
    const mockRequests = [
      { request_id: 1, subject: 'テスト見積依頼' },
    ];
    const mockVendors = [
      { user_id: 1, full_name: '田中太郎' },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockVendors }),
      });

    render(<NewResponsePage />);
    
    await waitFor(() => {
      expect(screen.getByText('テスト見積依頼')).toBeInTheDocument();
      expect(screen.getByText('田中太郎')).toBeInTheDocument();
    });
  });

  test('handles form submission', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NewResponsePage />);
    
    await waitFor(() => {
      const submitButton = screen.getByText('見積回答を作成');
      expect(submitButton).toBeDisabled();
    });
  });
});
