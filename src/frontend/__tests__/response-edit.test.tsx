import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditResponsePage from '../src/app/responses/[id]/edit/page';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useParams: () => ({ id: '1' }),
}));

describe('EditResponsePage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders edit form with existing data', async () => {
    const mockResponse = {
      response_id: 1,
      request_id: 1,
      vendor_id: 2,
      estimate_number: 'EST-2025-001',
      estimate_price: 1500000,
      total_amount: 1650000,
      delivery_date: '2025-02-28',
      validity_period: '30日間',
      terms_conditions: 'テスト条件',
      response_remarks: 'テスト備考',
      response_date: '2025-01-27',
      status: 'DRAFT',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(<EditResponsePage />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('EST-2025-001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1650000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30日間')).toBeInTheDocument();
    });
  });

  test('handles form submission', async () => {
    const mockResponse = {
      response_id: 1,
      request_id: 1,
      estimate_number: 'EST-2025-001',
      estimate_price: 1500000,
      status: 'DRAFT',
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      })
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

    render(<EditResponsePage />);
    
    await waitFor(() => {
      const submitButton = screen.getByText('見積回答を更新');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/responses/1'),
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });
});
