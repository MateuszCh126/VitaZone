const applyImageParams = (url, width) => {
  url.searchParams.set('auto', 'compress');
  url.searchParams.set('q', '85');
  url.searchParams.set('fit', 'crop');
  url.searchParams.set('w', width.toString());
  return url.toString();
};

export const getOptimizedImageUrl = (baseUrl, width = 800) => {
  if (!baseUrl) return baseUrl;

  try {
    const url = new URL(baseUrl);

    if (url.hostname.includes('unsplash.com')) {
      return applyImageParams(url, width);
    }

    if (url.hostname.includes('images.pexels.com')) {
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');
      url.searchParams.set('dpr', '1');
      url.searchParams.set('w', width.toString());
      return url.toString();
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
};

export const getSrcSet = (baseUrl, widths = [400, 800, 1200]) => {
  if (!baseUrl) return '';

  return widths
    .map((width) => `${getOptimizedImageUrl(baseUrl, width)} ${width}w`)
    .join(', ');
};
