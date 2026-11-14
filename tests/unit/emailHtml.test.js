import { describe, expect, it } from 'vitest';
import { escapeHtmlText } from '../../server/services/emailHtml.js';

describe('escapeHtmlText', () => {
    it('escapes HTML-significant characters in untrusted text', () => {
        expect(escapeHtmlText(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
    });

    it('preserves ordinary Unicode text and converts non-string values safely', () => {
        expect(escapeHtmlText('Cześć — żółw 🐢')).toBe('Cześć — żółw 🐢');
        expect(escapeHtmlText(null)).toBe('');
        expect(escapeHtmlText(42)).toBe('42');
    });
});
