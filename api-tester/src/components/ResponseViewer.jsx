import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const statusTone = (status) => {
  if (!status) return 'bg-gray-700';
  if (status >= 200 && status < 300) return 'bg-green-500';
  if (status >= 400 && status < 500) return 'bg-orange-500';
  if (status >= 500) return 'bg-red-500';
  return 'bg-gray-700';
};

const ResponseViewer = ({ response, error, isLoading }) => {
  const { addToast } = useAppContext();
  const [tab, setTab] = useState('body');
  const [bodyTab, setBodyTab] = useState('formatted');

  const formattedBody = useMemo(() => {
    if (response?.bodyJson) {
      return JSON.stringify(response.bodyJson, null, 2);
    }
    return response?.bodyText || '';
  }, [response]);

  const handleCopy = async () => {
    if (!response?.bodyText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(response.bodyText);
      addToast('Response copied', 'success');
    } catch (error) {
      addToast('Unable to copy response', 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Response</span>
        <button
          className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
          onClick={handleCopy}
          disabled={!response?.bodyText}
        >
          Copy
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm">
          Sending request...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!isLoading && !error && !response && (
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
          Send a request to see the response here.
        </div>
      )}

      {!isLoading && response && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-1 text-white ${statusTone(
                response.status
              )}`}
            >
              {response.status} {response.statusText}
            </span>
            <span className="rounded-full bg-gray-800 px-2 py-1 text-gray-300">
              {response.timeMs} ms
            </span>
            <span className="rounded-full bg-gray-800 px-2 py-1 text-gray-300">
              {response.size} bytes
            </span>
          </div>

          <div className="flex gap-2">
            {['body', 'headers'].map((item) => (
              <button
                key={item}
                className={`h-9 rounded-lg px-3 text-xs ${
                  tab === item ? 'bg-blue-600 text-white' : 'bg-gray-800'
                }`}
                onClick={() => setTab(item)}
              >
                {item === 'body' ? 'Body' : 'Headers'}
              </button>
            ))}
          </div>

          {tab === 'headers' && (
            <div className="max-h-[360px] overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs">
              {response.headers.length === 0 && (
                <div className="text-gray-400">No headers.</div>
              )}
              {response.headers.map((header) => (
                <div key={header.key} className="flex gap-2 py-1">
                  <span className="w-40 text-gray-400">{header.key}</span>
                  <span className="flex-1 break-all">{header.value}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'body' && (
            <div>
              <div className="mb-2 flex gap-2">
                {['formatted', 'raw', 'preview'].map((item) => (
                  <button
                    key={item}
                    className={`h-8 rounded-lg px-3 text-xs ${
                      bodyTab === item ? 'bg-blue-600 text-white' : 'bg-gray-800'
                    }`}
                    onClick={() => setBodyTab(item)}
                  >
                    {item === 'formatted'
                      ? 'Formatted'
                      : item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                ))}
              </div>
              {bodyTab === 'preview' && response.contentType.includes('text/html') ? (
                <iframe
                  title="preview"
                  className="h-[360px] w-full rounded-xl border border-gray-800 bg-white"
                  sandbox=""
                  srcDoc={response.bodyText}
                />
              ) : (
                <pre className="max-h-[360px] overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-gray-100">
                  {bodyTab === 'formatted' ? formattedBody : response.bodyText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
