import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const assignMock = vi.fn();
Object.defineProperty(window, 'location', {
  value: { assign: assignMock },
  configurable: true,
  writable: true,
});

describe('LoginPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    assignMock.mockReset();
  });

  it('renders email, password inputs and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeTruthy();
  });

  it('shows error message when login fails with a server message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Identifiants invalides' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeTruthy();
    });
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('shows fallback error message when server provides no message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la connexion')).toBeTruthy();
    });
  });

  it('shows network error message when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'));

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur réseau')).toBeTruthy();
    });
  });

  it('redirects to / on successful login', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mot de passe'), {
      target: { value: 'correctpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith('/');
    });
  });

  it('disables button and shows loading text while submitting', async () => {
    let resolveLogin!: (v: unknown) => void;
    fetchMock.mockReturnValue(
      new Promise((res) => {
        resolveLogin = res;
      }),
    );

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(screen.getByRole('button', { name: /Connexion.../i })).toHaveProperty(
      'disabled',
      true,
    );

    resolveLogin({ ok: true, json: async () => ({}) });
  });
});
