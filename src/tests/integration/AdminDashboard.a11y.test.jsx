import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/AdminDashboard.jsx';

const { demoAdmin } = vi.hoisted(() => ({ demoAdmin: { id: 'demo-admin', role: 'admin' } }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: demoAdmin, loading: false })
}));

const respond = (data) => ({ ok: true, json: async () => data });

describe('AdminDashboard accessible controls and copy', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn((url) => {
      if (url.endsWith('/api/admin/stats')) return Promise.resolve(respond({}));
      if (url.endsWith('/api/admin/orders')) return Promise.resolve(respond([]));
      if (url.endsWith('/api/admin/products')) return Promise.resolve(respond([]));
      if (url.endsWith('/api/admin/users')) return Promise.resolve(respond([
        { id: 'u1', name: 'Zofia', email: 'zofia@example.test', role: 'user', joined: '2026-01-01', orderCount: 0, totalSpent: 20 },
        { id: 'u2', name: 'Adam', email: 'adam@example.test', role: 'user', joined: '2026-01-02', orderCount: 0, totalSpent: 10 }
      ]));
      return Promise.resolve(respond([]));
    });
  });

  const renderAdmin = () => render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

  it('removes the nonfunctional order search', async () => {
    renderAdmin();
    await screen.findByRole('heading', { name: 'Kolejka zamówień' });
    expect(screen.queryByPlaceholderText('Szukaj zamówień...')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('uses semantic keyboard-operable sort buttons and updates aria-sort when sorting', async () => {
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Użytkownicy' }));
    const nameButton = await screen.findByRole('button', { name: /użytkownik/i });
    nameButton.focus();
    expect(nameButton).toHaveAttribute('type', 'button');
    expect(nameButton).toHaveFocus();
    fireEvent.click(nameButton);
    const usersTable = screen.getByRole('table');
    const nameHeader = within(usersTable).getByRole('columnheader', { name: /użytkownik/i });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(within(usersTable).getByRole('columnheader', { name: /rola/i })).not.toHaveAttribute('aria-sort');
    const rows = within(usersTable).getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Adam');
    expect(rows[1]).toHaveTextContent('Zofia');

    fireEvent.click(within(nameHeader).getByRole('button', { name: /użytkownik/i }));
    await waitFor(() => expect(nameHeader).toHaveAttribute('aria-sort', 'descending'));
  });

  it('uses accurate product copy for the inventory action', async () => {
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'Magazyn' }));
    expect(await screen.findByRole('button', { name: /dodaj produkt/i })).toBeInTheDocument();
  });
});
