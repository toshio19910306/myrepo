import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import VendorsPage from '../src/app/vendors/page';

global.fetch = jest.fn();

describe('VendorsPage', () => {
  beforeEach(() => {
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  test('renders vendors page with empty state', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<VendorsPage />);
    
    expect(screen.getByText('ベンダー管理')).toBeInTheDocument();
    expect(screen.getByText('ベンダー情報の登録・管理を行います')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('ベンダーが登録されていません')).toBeInTheDocument();
    });
  });

  test('renders vendors list when data is available', async () => {
    const mockVendors = [
      {
        user_id: 1,
        username: 'vendor1',
        email: 'vendor1@example.com',
        full_name: '田中太郎',
        company_name: '株式会社テストベンダー',
        department: '営業部',
        position: '課長',
        is_active: true,
        created_at: '2025-01-27T00:00:00Z',
      },
    ];

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockVendors }),
    } as Response);

    render(<VendorsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('株式会社テストベンダー')).toBeInTheDocument();
      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('営業部')).toBeInTheDocument();
      expect(screen.getByText('課長')).toBeInTheDocument();
    });
  });

  test('opens create vendor dialog when button is clicked', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    render(<VendorsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('新規ベンダー登録')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('新規ベンダー登録'));
    
    await waitFor(() => {
      expect(screen.getByText('ベンダーの基本情報を入力してください')).toBeInTheDocument();
    });
  });

  test('handles vendor creation form submission', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response);

    render(<VendorsPage />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('新規ベンダー登録'));
    });

    await waitFor(() => {
      const companyNameInput = screen.getByLabelText(/ベンダー名/);
      const fullNameInput = screen.getByLabelText(/担当者名/);
      const emailInput = screen.getByLabelText(/メールアドレス/);
      const usernameInput = screen.getByLabelText(/ユーザー名/);
      const passwordInput = screen.getByLabelText(/パスワード/);

      fireEvent.change(companyNameInput, { target: { value: 'テストベンダー' } });
      fireEvent.change(fullNameInput, { target: { value: '山田太郎' } });
      fireEvent.change(emailInput, { target: { value: 'yamada@test.com' } });
      fireEvent.change(usernameInput, { target: { value: 'yamada' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(screen.getByRole('button', { name: '登録' }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('テストベンダー'),
        })
      );
    });
  });
});
