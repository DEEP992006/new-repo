import { createId } from './storage';

export const applyVariables = (value, variables) => {
  if (!value) {
    return '';
  }
  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key];
    }
    return match;
  });
};

const normalizePairs = (pairs) =>
  (pairs || [])
    .filter((pair) => pair.key && pair.key.trim().length > 0)
    .map((pair) => ({ key: pair.key.trim(), value: pair.value || '' }));

export const buildUrl = (request, variables) => {
  const rawUrl = applyVariables(request.url, variables);
  const url = new URL(rawUrl);
  normalizePairs(request.queryParams).forEach((pair) => {
    const key = applyVariables(pair.key, variables);
    const value = applyVariables(pair.value, variables);
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const buildHeaders = (request, variables) => {
  const headers = {};
  normalizePairs(request.headers).forEach((pair) => {
    headers[pair.key] = applyVariables(pair.value, variables);
  });
  if (request.auth?.type === 'bearer' && request.auth.token) {
    headers.Authorization = `Bearer ${applyVariables(request.auth.token, variables)}`;
  }
  if (
    request.auth?.type === 'basic' &&
    request.auth.username &&
    request.auth.password
  ) {
    const username = applyVariables(request.auth.username, variables);
    const password = applyVariables(request.auth.password, variables);
    headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }
  return headers;
};

const buildBody = (request, variables, headers) => {
  if (['GET', 'HEAD'].includes(request.method)) {
    return undefined;
  }

  if (request.bodyType === 'form-data') {
    const form = new FormData();
    normalizePairs(request.formData).forEach((pair) => {
      form.append(pair.key, applyVariables(pair.value, variables));
    });
    return form;
  }

  if (request.bodyType === 'raw') {
    return applyVariables(request.body, variables);
  }

  if (request.bodyType === 'json') {
    const raw = applyVariables(request.body, variables);
    if (!raw || raw.trim().length === 0) {
      return undefined;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error('Invalid JSON body');
    }
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    return JSON.stringify(parsed);
  }

  return undefined;
};

export const buildCurlCommand = (request, variables) => {
  const url = buildUrl(request, variables);
  const headers = buildHeaders(request, variables);
  const headerArgs = Object.entries(headers).map(
    ([key, value]) => `-H "${key}: ${value}"`
  );
  let bodyArgs = [];
  if (request.bodyType === 'form-data') {
    bodyArgs = normalizePairs(request.formData).map(
      (pair) => `-F "${pair.key}=${applyVariables(pair.value, variables)}"`
    );
  } else if (request.bodyType === 'raw') {
    const raw = applyVariables(request.body, variables);
    if (raw) {
      bodyArgs = [`--data-raw '${raw.replace(/'/g, "'\"'\"'")}'`];
    }
  } else if (request.bodyType === 'json') {
    const raw = applyVariables(request.body, variables);
    if (raw) {
      bodyArgs = [`--data '${raw.replace(/'/g, "'\"'\"'")}'`];
    }
  }

  const methodArg =
    request.method && request.method !== 'GET' ? `-X ${request.method}` : '';
  const parts = ['curl', methodArg, ...headerArgs, ...bodyArgs, `"${url}"`]
    .filter(Boolean)
    .join(' ');
  return parts;
};

export const sendRequest = async (request, variables, timeoutMs = 15000) => {
  let url;
  try {
    url = buildUrl(request, variables);
  } catch (error) {
    throw new Error('Invalid URL');
  }

  const headers = buildHeaders(request, variables);
  const body = buildBody(request, variables, headers);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      signal: controller.signal
    });

    const elapsed = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const size = new Blob([text]).size;
    let json = null;

    if (contentType.includes('application/json')) {
      try {
        json = JSON.parse(text);
      } catch (error) {
        json = null;
      }
    }

    const headersArray = [...response.headers.entries()].map(([key, value]) => ({
      key,
      value
    }));

    return {
      id: createId(),
      request,
      response: {
        status: response.status,
        statusText: response.statusText,
        timeMs: elapsed,
        size,
        headers: headersArray,
        bodyText: text,
        bodyJson: json,
        contentType
      }
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw new Error(error.message || 'Network error');
  } finally {
    clearTimeout(timeout);
  }
};
