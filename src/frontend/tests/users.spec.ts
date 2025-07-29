import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
  });

  test('should display users page without user_type field in create form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ユーザー管理');
    
    await page.click('button:has-text("新規ユーザー作成")');
    
    await expect(page.locator('h2')).toContainText('新規ユーザー作成');
    
    await expect(page.locator('label:has-text("ユーザーID")')).toBeVisible();
    await expect(page.locator('label:has-text("姓")')).toBeVisible();
    await expect(page.locator('label:has-text("名")')).toBeVisible();
    await expect(page.locator('label:has-text("メールアドレス")')).toBeVisible();
    await expect(page.locator('label:has-text("部門")')).toBeVisible();
    await expect(page.locator('label:has-text("職位")')).toBeVisible();
    await expect(page.locator('label:has-text("権限")')).toBeVisible();
    
    await expect(page.locator('label:has-text("ユーザー種別")')).not.toBeVisible();
    await expect(page.locator('label:has-text("user_type")')).not.toBeVisible();
    await expect(page.locator('select[name="user_type"]')).not.toBeVisible();
    await expect(page.locator('input[name="user_type"]')).not.toBeVisible();
  });

  test('should create user without user_type field in request payload', async ({ page }) => {
    await page.route('/api/users', async (route) => {
      const request = route.request();
      const postData = request.postData();
      
      if (request.method() === 'POST' && postData) {
        const payload = JSON.parse(postData);
        
        expect(payload).not.toHaveProperty('user_type');
        expect(payload).toHaveProperty('username');
        expect(payload).toHaveProperty('email');
        expect(payload).toHaveProperty('full_name');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_id: 1,
              username: payload.username,
              email: payload.email,
              full_name: payload.full_name,
              department: payload.department,
              position: payload.position,
              user_type: 'IT',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            message: '新規ユーザーが正常に作成されました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.click('button:has-text("新規ユーザー作成")');
    
    await page.fill('input[id="userId"]', 'testuser');
    await page.fill('input[id="lastName"]', 'テスト');
    await page.fill('input[id="firstName"]', 'ユーザー');
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="department"]', 'IT部');
    await page.fill('input[id="position"]', '開発者');
    
    await page.click('button:has-text("保存")');
    
    await expect(page.locator('text=新規ユーザーが正常に作成されました')).toBeVisible();
  });

  test('should display user details with user_type from backend response', async ({ page }) => {
    await page.route('/api/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              user_id: 1,
              username: 'testuser',
              email: 'test@example.com',
              full_name: 'テスト ユーザー',
              department: 'IT部',
              position: '開発者',
              user_type: 'IT',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }],
            message: 'ユーザー一覧を取得しました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.route('/api/users/1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user_id: 1,
              username: 'testuser',
              email: 'test@example.com',
              full_name: 'テスト ユーザー',
              department: 'IT部',
              position: '開発者',
              user_type: 'IT',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            message: 'ユーザー詳細を取得しました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.reload();
    
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('td:has-text("testuser")')).toBeVisible();
    
    await page.click('button:has-text("詳細")');
    
    await expect(page.locator('h2:has-text("ユーザー詳細")')).toBeVisible();
    await expect(page.locator('td:has-text("testuser")')).toBeVisible();
    await expect(page.locator('td:has-text("test@example.com")')).toBeVisible();
    await expect(page.locator('td:has-text("テスト ユーザー")')).toBeVisible();
  });

  test('should update user without user_type in request payload', async ({ page }) => {
    await page.route('/api/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              user_id: 1,
              username: 'testuser',
              email: 'test@example.com',
              full_name: 'テスト ユーザー',
              department: 'IT部',
              position: '開発者',
              user_type: 'IT',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }],
            message: 'ユーザー一覧を取得しました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.route('/api/users/1', async (route) => {
      const request = route.request();
      
      if (request.method() === 'PUT') {
        const postData = request.postData();
        if (postData) {
          const payload = JSON.parse(postData);
          
          expect(payload).not.toHaveProperty('user_type');
          expect(payload).toHaveProperty('full_name');
          expect(payload).toHaveProperty('email');
          
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user_id: 1,
                username: 'testuser',
                email: payload.email,
                full_name: payload.full_name,
                department: payload.department,
                position: payload.position,
                user_type: 'IT',
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: new Date().toISOString()
              },
              message: 'ユーザー情報を更新しました',
              timestamp: new Date().toISOString()
            })
          });
        }
      }
    });

    await page.reload();
    
    await page.click('button:has-text("更新")');
    
    await expect(page.locator('h2:has-text("ユーザー情報更新")')).toBeVisible();
    
    await page.fill('input[id="update_email"]', 'updated@example.com');
    await page.fill('input[id="update_firstName"]', '更新');
    await page.fill('input[id="update_lastName"]', 'ユーザー');
    
    await page.click('button[type="submit"]:has-text("更新")');
    
    await expect(page.locator('text=ユーザー情報が正常に更新されました')).toBeVisible();
  });

  test('should delete user successfully', async ({ page }) => {
    await page.route('/api/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              user_id: 1,
              username: 'testuser',
              email: 'test@example.com',
              full_name: 'テスト ユーザー',
              department: 'IT部',
              position: '開発者',
              user_type: 'IT',
              is_active: true,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }],
            message: 'ユーザー一覧を取得しました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.route('/api/users/1', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { user_id: 1 },
            message: 'ユーザーを削除しました',
            timestamp: new Date().toISOString()
          })
        });
      }
    });

    await page.reload();
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('button:has-text("削除")');
    
    await expect(page.locator('text=ユーザーが正常に削除されました')).toBeVisible();
  });

  test('should verify NewUser interface excludes user_type', async ({ page }) => {
    await page.goto('/users');
    
    await page.click('button:has-text("新規ユーザー作成")');
    
    const formInputs = await page.locator('input, select, textarea').all();
    const inputNames = await Promise.all(
      formInputs.map(async (input) => {
        const name = await input.getAttribute('name');
        const id = await input.getAttribute('id');
        return name || id;
      })
    );
    
    expect(inputNames).not.toContain('user_type');
    expect(inputNames).not.toContain('userType');
    
    const labels = await page.locator('label').allTextContents();
    expect(labels.join(' ')).not.toContain('ユーザー種別');
    expect(labels.join(' ')).not.toContain('user_type');
  });
});
