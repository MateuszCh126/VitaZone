const HTML_ESCAPE_MAP = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
});

export const escapeHtmlText = (value) => (
    String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character])
);
