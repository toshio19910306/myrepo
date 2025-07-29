import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';

describe('UI Components', () => {
  describe('Button', () => {
    test('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    test('renders button with variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button', { name: 'Delete' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-secondary');
    });

    test('renders disabled button', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button', { name: 'Disabled' });
      expect(button).toBeDisabled();
    });
  });

  describe('Input', () => {
    test('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('renders input with value', () => {
      render(<Input value="test value" readOnly />);
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });

    test('renders input with type', () => {
      render(<Input type="email" placeholder="Email" />);
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('Card', () => {
    test('renders card with content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      );
      
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('renders card with custom className', () => {
      render(
        <Card className="custom-class">
          <CardContent>Content</CardContent>
        </Card>
      );
      
      const card = screen.getByText('Content').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });
});
