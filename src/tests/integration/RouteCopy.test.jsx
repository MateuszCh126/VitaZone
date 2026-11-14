import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('route copy claims and form semantics', () => {
  it('describes the Stripe checkout without making security guarantees', () => {
    const cart = readSource('../../components/CartDrawer.jsx');
    expect(cart).toContain('Płatność przez Stripe Checkout');
    expect(cart).not.toMatch(/Bezpieczna szyfrowana płatność/i);
  });

  it('uses neutral contact wording and accurately labels the FAQ link', () => {
    const contact = readSource('../../pages/Contact.jsx');
    const footer = readSource('../../components/Footer.jsx');
    expect(contact).toContain('Dane do potwierdzenia');
    expect(contact).not.toMatch(/szybka ścieżka pomocy/i);
    expect(footer).toContain('FAQ: dostawa, płatności i zwroty');
    expect(footer).not.toContain('FAQ i wysyłka');
  });

  it('does not expose the unverified legacy email address as a contact channel', () => {
    const contact = readSource('../../pages/Contact.jsx');
    const faq = readSource('../../pages/FAQ.jsx');
    const footer = readSource('../../components/Footer.jsx');
    expect(`${contact}\n${faq}\n${footer}`).not.toContain('kontakt@animalsshop.pl');
    expect(contact).toContain('wymagają potwierdzenia przez właściciela');
    expect(faq).toContain('to="/contact"');
  });

  it('uses the shared accent token for FAQ controls', () => {
    const faq = readSource('../../pages/FAQ.jsx');
    expect(faq).toContain('text-primary');
    expect(faq).not.toMatch(/emerald-(?:[0-9]+)/);
  });

  it('keeps legal page headings solid and uses the shared accent token', () => {
    const legalPages = [
      '../../pages/legal/CookiesPolicy.jsx',
      '../../pages/legal/PrivacyPolicy.jsx',
      '../../pages/legal/TermsAndConditions.jsx',
      '../../pages/legal/Withdrawal.jsx'
    ].map(readSource).join('\n');
    expect(legalPages).not.toMatch(/bg-gradient-to-r|text-transparent|emerald-[0-9]+/);
    expect(legalPages).toContain('text-primary');
  });

  it('does not imply the cookie introduction is a complete inventory', () => {
    const cookies = readSource('../../pages/legal/CookiesPolicy.jsx');
    expect(cookies).toContain('Informacje o ustawieniach zgody');
    expect(cookies).not.toContain('Wyjaśniamy, jakich plików cookies używamy');
  });

  it('describes current product availability without promising an order outcome', () => {
    const product = readSource('../../pages/ProductDetail.jsx');
    expect(product).toContain("product.stock > 0 ? 'Dostępny' : 'Chwilowo niedostępny'");
    expect(product).not.toContain('Gotowe do zamówienia');
    expect(product).not.toMatch(/zarezerwowan|gwarantowan/i);
  });

  it('localizes the login email placeholder and keeps a labeled email field', () => {
    const login = readSource('../../pages/Login.jsx');
    expect(login).toContain('placeholder="adres@przyklad.pl"');
    expect(login).toMatch(/htmlFor="login-email"[\s\S]*?id="login-email"[\s\S]*?type="email"/);
    expect(login).toContain('Adres email');
  });
});
