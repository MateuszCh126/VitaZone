const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchJsonWithRetry = async (url, options = {}, retries = 2) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const bodyPreview = (await response.text()).slice(0, 120);
        throw new Error(`Expected JSON, received ${contentType || 'unknown'}: ${bodyPreview}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Request failed');
};
