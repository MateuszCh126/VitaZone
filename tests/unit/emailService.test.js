import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
    Resend: class ResendMock {
        emails = { send: mocks.send };
    }
}));
vi.mock('../../server/config/env.js', () => ({
    default: { RESEND_API_KEY: 're_demo_only', RESEND_FROM_EMAIL: 'VitaZone <shop@example.test>' }
}));
vi.mock('../../server/config/logger.js', () => ({ default: { info: vi.fn(), error: vi.fn() } }));

const { sendOrderPaidEmail, sendOrderStatusEmail } = await import('../../server/services/emailService.js');

describe('transactional email HTML', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.send.mockResolvedValue({ data: { id: 'email_demo_1' }, error: null });
    });

    it('renders customer and product supplied text as escaped HTML text', async () => {
        await sendOrderPaidEmail({
            id: '12345678-1234-4123-8123-123456789abc',
            total_amount: 12.5,
            shipping_address_json: {
                email: 'client@example.test',
                full_name: '<img src=x onerror=alert(1)>'
            },
            items: [{ quantity: 1, price: 12.5, name: '<svg onload=alert(1)>' }]
        });

        const html = mocks.send.mock.calls[0][0].html;
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(html).toContain('&lt;svg onload=alert(1)&gt;');
        expect(html).not.toContain('<img src=x');
        expect(html).not.toContain('<svg onload=');
    });

    it('escapes an unexpected status value before inserting it into the email', async () => {
        await sendOrderStatusEmail({
            id: '12345678-1234-4123-8123-123456789abc',
            status: '<img src=x>',
            total_amount: 12.5,
            shipping_address_json: { email: 'client@example.test' },
            items: []
        }, '<script>');

        const html = mocks.send.mock.calls[0][0].html;
        expect(html).toContain('&lt;img src=x&gt;');
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>');
    });
});
