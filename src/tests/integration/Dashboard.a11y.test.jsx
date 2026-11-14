import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard.jsx';

const { demoUser } = vi.hoisted(() => ({
  demoUser: {
    id: 'demo-user', name: 'Demo User', email: 'demo@example.test', role: 'user',
    country: '', city: '', postalCode: '', street: '', houseNumber: '', apartmentNumber: ''
  }
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: demoUser,
    logout: vi.fn(), updateProfile: vi.fn(), loading: false
  })
}));

describe('Dashboard accessibility and account copy', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
  });

  it('associates each address label with its input', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /ustawienia/i }));

    const addressFields = await Promise.all(
      ['Kraj', 'Miasto', 'Kod Pocztowy', 'Ulica', 'Numer domu', 'Numer lokalu (opcjonalnie)']
        .map((label) => screen.findByLabelText(label))
    );
    addressFields.forEach((field) => expect(field).toBeInTheDocument());
  });

  it('does not invent an account creation date when it is missing', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Data założenia konta').parentElement).not.toHaveTextContent('Dzisiaj');
    expect(screen.getByText('Data założenia konta').parentElement).toHaveTextContent('Nie podano');
  });

  it('does not open an email draft to an unverified address', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /moje zamówienia/i }));
    expect(await screen.findByText(/kanał kontaktu nie jest obecnie dostępny w panelu/i)).toBeInTheDocument();
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });
});
