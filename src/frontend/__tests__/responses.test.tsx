import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResponsesPage from '../src/app/responses/page';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ResponsesPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('renders responses page with empty state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<ResponsesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('見積回答')).toBeInTheDocument();
      expect(screen.getByText('見積依頼に対する回答を管理します')).toBeInTheDocument();
      expect(screen.getByText('見積回答がありません')).toBeInTheDocument();
    });
  });

  test('renders responses list when data is available', async () => {
    const mockResponses = [
      {
        response_id: 1,
        estimate_number: 'EST-2025-001',
        estimate_price: 1500000,
        total_amount: 1650000,
        delivery_date: '2025/02/28',
        validity_period: '30日間',
        status: 'SUBMITTED',
        created_at: '2025-01-27T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResponses }),
    });

    render(<ResponsesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('EST-2025-001')).toBeInTheDocument();
      expect(screen.getByText('￥1,500,000')).toBeInTheDocument();
      expect(screen.getByText('￥1,650,000')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<ResponsesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/見積回答の取得中にエラーが発生しました/)).toBeInTheDocument();
    });
  });

  test('search functionality filters responses', async () => {
    const mockResponses = [
      {
        response_id: 1,
        estimate_number: 'EST-2025-001',
        estimate_price: 1500000,
        status: 'SUBMITTED',
        created_at: '2025-01-27T00:00:00Z',
      },
      {
        response_id: 2,
        estimate_number: 'EST-2025-002',
        estimate_price: 2000000,
        status: 'DRAFT',
        created_at: '2025-01-27T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockResponses }),
    });

    render(<ResponsesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('EST-2025-001')).toBeInTheDocument();
      expect(screen.getByText('EST-2025-002')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/見積番号で検索/);
    fireEvent.change(searchInput, { target: { value: 'EST-2025-001' } });

    await waitFor(() => {
      expect(screen.getByText('EST-2025-001')).toBeInTheDocument();
      expect(screen.queryByText('EST-2025-002')).not.toBeInTheDocument();
    });
  });
});
