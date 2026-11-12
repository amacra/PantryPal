import { render, screen } from '@testing-library/react';
import App from './App';
test('shows the landing page and account navigation', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Welcome to PantryPal' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
});
