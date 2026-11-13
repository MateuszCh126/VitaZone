// Escape HTML-significant characters before embedding JSON in a script element.
// This prevents product content such as `</script>` from ending the JSON-LD tag.
export const serializeJsonLd = (value) => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');
