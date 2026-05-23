import React, { useMemo, useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import Collections from './components/Collections';
import Environment from './components/Environment';
import History from './components/History';
import { sendRequest } from './utils/http';

const AppShell = () => {
  const { state, addHistoryItem, addToast, setActiveEnvironment, toasts } =
    useAppContext();
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [requestErrors, setRequestErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeEnvironment = useMemo(
    () =>
      state.environments.find((env) => env.id === state.activeEnvironmentId) ||
      state.environments[0],
    [state.activeEnvironmentId, state.environments]
  );

  const variables = useMemo(() => {
    const map = {};
    (activeEnvironment?.variables || []).forEach((variable) => {
      if (variable.key) {
        map[variable.key] = variable.value || '';
      }
    });
    return map;
  }, [activeEnvironment]);

  const handleSend = async () => {
    setRequestErrors({});
    setError('');
    setIsSending(true);
    try {
      const result = await sendRequest(state.activeRequest, variables);
      setResponse(result.response);
      addHistoryItem({
        ...state.activeRequest,
        id: result.id,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      if (err.message === 'Invalid URL') {
        setRequestErrors({ url: 'Enter a valid URL (include http/https).' });
      } else if (err.message === 'Invalid JSON body') {
        setRequestErrors({ body: 'Body must be valid JSON.' });
      } else {
        setError(err.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">API Tester</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              className="h-10 rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm"
              value={activeEnvironment?.id || ''}
              onChange={(event) => {
                if (event.target.value !== state.activeEnvironmentId) {
                  setActiveEnvironment(event.target.value);
                  addToast('Environment switched', 'info');
                }
              }}
            >
              {state.environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
            <button
              className="h-10 rounded-lg bg-gray-900 px-3 text-sm md:hidden"
              onClick={() => setShowHistory(true)}
            >
              History
            </button>
            <button
              className="h-10 rounded-lg bg-gray-900 px-3 text-sm md:hidden"
              onClick={() => setShowCollections(true)}
            >
              Collections
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <RequestBuilder
            onSend={handleSend}
            isSending={isSending}
            requestErrors={requestErrors}
            variables={variables}
          />
          <div className="hidden gap-4 md:grid md:grid-cols-2">
            <Environment />
            <History />
          </div>
          <div className="hidden md:block">
            <Collections />
          </div>
        </div>
        <ResponseViewer response={response} error={error} isLoading={isSending} />
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gray-950 p-4 transition-panel">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">History</span>
              <button
                className="rounded-lg bg-gray-900 px-3 py-1 text-sm"
                onClick={() => setShowHistory(false)}
              >
                Close
              </button>
            </div>
            <History onClose={() => setShowHistory(false)} />
          </div>
        </div>
      )}

      {showCollections && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden">
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-gray-950 p-4 transition-panel">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Collections</span>
              <button
                className="rounded-lg bg-gray-900 px-3 py-1 text-sm"
                onClick={() => setShowCollections(false)}
              >
                Close
              </button>
            </div>
            <Collections onClose={() => setShowCollections(false)} />
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm shadow-lg ${
              toast.tone === 'success'
                ? 'bg-green-500 text-white'
                : toast.tone === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
