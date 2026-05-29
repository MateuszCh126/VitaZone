import { Resend } from 'resend';
import env from '../config/env.js';
import logger from '../config/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const statusLabels = {
    payment_pending: 'Oczekiwanie na płatność',
    pending: 'Opłacone, oczekuje na realizację',
    accepted: 'Przyjęte do realizacji',
    processing: 'W realizacji',
    ready: 'Gotowe do nadania lub odbioru',
    shipped: 'Wysłane',
    completed: 'Zakończone',
    cancelled: 'Anulowane',
    refunded: 'Zwrot wykonany'
};

const buildItemsHtml = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        return '<li>Brak pozycji do wyświetlenia</li>';
    }

    return items
        .map((item) => {
            const quantity = item.quantity || 1;
            const price = typeof item.price === 'number'
                ? item.price.toFixed(2)
                : (Number(item.price) || 0).toFixed(2);
            return `<li>${quantity}x ${item.name || 'Produkt'} - ${price} zł</li>`;
        })
        .join('');
};

const buildEmailShell = ({ title, intro, details, footer }) => `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#07120d;padding:32px;color:#ecfdf5;">
    <div style="max-width:640px;margin:0 auto;background:#0b1611;border:1px solid rgba(45,242,154,0.18);border-radius:24px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:#34d399;font-weight:700;">AnimalsShop</div>
        <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">${title}</h1>
      </div>
      <div style="padding:28px;color:#d1fae5;line-height:1.65;font-size:15px;">
        <p style="margin-top:0;">${intro}</p>
        ${details}
        <p style="margin:24px 0 0;color:#9ca3af;">${footer}</p>
      </div>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
    if (!resend || !env.RESEND_FROM_EMAIL) {
        logger.info('Transactional email skipped because Resend is not configured', {
            subject,
            to
        });
        return { skipped: true };
    }

    const payload = {
        from: env.RESEND_FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
    };

    const { data, error } = await resend.emails.send(payload);
    if (error) {
        throw new Error(error.message || 'Failed to send transactional email');
    }

    return data;
};

const getOrderEmailRecipient = (order) => {
    const email = order?.shipping_address_json?.email;
    return typeof email === 'string' && email.includes('@') ? email : null;
};

export const sendOrderPaidEmail = async (order) => {
    const to = getOrderEmailRecipient(order);
    if (!to) return null;

    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const fullName = order.shipping_address_json?.full_name || 'Kliencie';
    const totalAmount = Number(order.total_amount || 0).toFixed(2);

    return sendEmail({
        to,
        subject: `AnimalsShop: potwierdzenie opłacenia zamówienia #${orderNumber}`,
        html: buildEmailShell({
            title: `Zamówienie #${orderNumber} zostało opłacone`,
            intro: `Cześć ${fullName}, otrzymaliśmy płatność i przekazaliśmy zamówienie do dalszej realizacji.`,
            details: `
              <div style="margin:24px 0;padding:18px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0 0 10px;"><strong>Status:</strong> ${statusLabels.pending}</p>
                <p style="margin:0 0 10px;"><strong>Suma:</strong> ${totalAmount} zł</p>
                <p style="margin:0 0 10px;"><strong>Email zamówienia:</strong> ${to}</p>
                <p style="margin:0;"><strong>Pozycje:</strong></p>
                <ul style="margin:10px 0 0;padding-left:20px;">${buildItemsHtml(order.items)}</ul>
              </div>
            `,
            footer: 'Jeśli masz pytania o realizację, odpisz na tę wiadomość albo skontaktuj się z nami przez kontakt@animalsshop.pl.'
        })
    });
};

export const sendOrderStatusEmail = async (order, previousStatus) => {
    const to = getOrderEmailRecipient(order);
    if (!to) return null;

    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const nextLabel = statusLabels[order.status] || order.status;
    const previousLabel = previousStatus ? (statusLabels[previousStatus] || previousStatus) : 'poprzedni etap';

    return sendEmail({
        to,
        subject: `AnimalsShop: aktualizacja zamówienia #${orderNumber}`,
        html: buildEmailShell({
            title: `Status zamówienia #${orderNumber}: ${nextLabel}`,
            intro: `Twoje zamówienie zmieniło status z „${previousLabel}” na „${nextLabel}”.`,
            details: `
              <div style="margin:24px 0;padding:18px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0 0 10px;"><strong>Nowy status:</strong> ${nextLabel}</p>
                <p style="margin:0 0 10px;"><strong>Suma:</strong> ${Number(order.total_amount || 0).toFixed(2)} zł</p>
                <p style="margin:0;"><strong>Najważniejsze pozycje:</strong></p>
                <ul style="margin:10px 0 0;padding-left:20px;">${buildItemsHtml(order.items)}</ul>
              </div>
            `,
            footer: 'Jeżeli potrzebujesz pomocy z zamówieniem, odpisz na wiadomość lub zajrzyj do panelu klienta.'
        })
    });
};
