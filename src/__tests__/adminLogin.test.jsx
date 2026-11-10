import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isDemoMode: false,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }),
}));

import TeacherPage from '../pages/TeacherPage';

describe('Admin Username Login UI', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockSignOut.mockReset();
  });

  it('renders Username and Password fields and submits username cleanly', async () => {
    mockSignIn.mockResolvedValue({ id: 'u1', email: 'admin@storybook.local' });

    render(
      <MemoryRouter>
        <TeacherPage onNotify={vi.fn()} />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('autocomplete', 'username');
    expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('admin', 'secret123');
    });
  });

  it('shows friendly validation error if username contains spaces', async () => {
    render(
      <MemoryRouter>
        <TeacherPage onNotify={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bad name' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Username cannot contain spaces/
      );
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
