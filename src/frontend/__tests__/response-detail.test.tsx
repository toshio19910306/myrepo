import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ResponseDetailPage from '../src/app/responses/[id]/page';

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

describe('ResponseDetailPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders response detail page with data', async () => {
    const mockResponse = {
      response_id: 1,
      estimate_number: 'EST-2025-001',
      estimate_price: 1500000,
      total_amount: 1650000,
      delivery_date: '2025-02-28',
      validity_period: '30日間',
      status: 'SUBMITTED',
      terms_conditions: 'テスト条件',
      response_remarks: 'テスト備考',
      created_at: '2025-01-27T00:00:00Z',
      updated_at: '2025-01-27T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResponse }),
    });

    render(<ResponseDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('見積回答詳細')).toBeInTheDocument();
      expect(screen.getByText('EST-2025-001')).toBeInTheDocument();
      expect(screen.getByText('￥1,500,000')).toBeInTheDocument();
      expect(screen.getByText('￥1,650,000')).toBeInTheDocument();
      expect(screen.getByText('テスト条件')).toBeInTheDocument();
      expect(screen.getByText('テスト備考')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ResponseDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/見積回答の取得中にエラーが発生しました/)).toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<ResponseDetailPage />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });
});
