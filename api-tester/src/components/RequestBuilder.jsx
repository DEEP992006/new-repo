import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { buildCurlCommand } from '../utils/http';

const Section = ({ title, isOpen, onToggle, children }) => (
  <div className="rounded-xl border border-gray-800 bg-gray-900">
    <button
      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
      onClick={onToggle}
    >
      <span>{title}</span>
      <span className="text-xs text-gray-400">{isOpen ? 'Hide' : 'Show'}</span>
    </button>
    {isOpen && <div className="border-t border-gray-800 px-4 py-3">{children}</div>}
  </div>
);

const RequestBuilder = ({ onSend, isSending, requestErrors, variables }) => {
  const {
    state,
    setActiveRequest,
    addRequestToCollection,
    addToast,
    createCollection
  } = useAppContext();
  const [sections, setSections] = useState({
    query: true,
    headers: true,
    body: true,
    auth: true,
    save: true
  });
  const [saveError, setSaveError] = useState('');

  const request = state.activeRequest;

  const historyUrls = useMemo(() => {
    const urls = state.history.map((item) => item.url).filter(Boolean);
    return [...new Set(urls)].slice(0, 50);
  }, [state.history]);

  const updateRequest = (updates) => {
    setActiveRequest((prev) => ({ ...prev, ...updates }));
  };

  const updatePairList = (field, index, updates) => {
    const next = [...(request[field] || [])];
    next[index] = { ...next[index], ...updates };
    updateRequest({ [field]: next });
  };

  const addPair = (field) => {
    updateRequest({ [field]: [...(request[field] || []), { key: '', value: '' }] });
  };

  const removePair = (field, index) => {
    const next = (request[field] || []).filter((_, idx) => idx !== index);
    updateRequest({ [field]: next.length ? next : [{ key: '', value: '' }] });
  };

  const handleSave = useCallback(() => {
    setSaveError('');
    if (!request.collectionId) {
      setSaveError('Choose a collection.');
      return;
    }
    if (!request.name?.trim()) {
      setSaveError('Give this request a name.');
      return;
    }
    addRequestToCollection(request.collectionId, {
      name: request.name,
      description: request.description,
      folder: request.folder,
      method: request.method,
      url: request.url,
      queryParams: request.queryParams,
      headers: request.headers,
      body: request.body,
      bodyType: request.bodyType,
      formData: request.formData,
      auth: request.auth
    });
    addToast('Request saved to collection', 'success');
  }, [addRequestToCollection, addToast, request]);

  const handleCopyCurl = async () => {
    try {
      const curl = buildCurlCommand(request, variables);
      await navigator.clipboard.writeText(curl);
      addToast('cURL copied', 'success');
    } catch (error) {
      addToast('Unable to copy cURL', 'error');
    }
  };

  useEffect(() => {
    const handleKeys = (event) => {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        onSend();
      }
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [handleSave, onSend]);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-glow">
      <div className="sticky top-[58px] z-10 -mx-4 -mt-4 mb-4 border-b border-gray-800 bg-gray-900/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm font-semibold"
            value={request.method}
            onChange={(event) => updateRequest({ method: event.target.value })}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <input
              className="h-11 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
              placeholder="https://api.example.com"
              list="history-urls"
              value={request.url}
              onChange={(event) => updateRequest({ url: event.target.value })}
            />
            {requestErrors.url && (
              <span className="text-xs text-red-400">{requestErrors.url}</span>
            )}
          </div>
          <button
            className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onSend}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
          <button
            className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-4 text-sm"
            onClick={handleCopyCurl}
          >
            Copy cURL
          </button>
        </div>
        <datalist id="history-urls">
          {historyUrls.map((url) => (
            <option key={url} value={url} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
          placeholder="Request name"
          value={request.name}
          onChange={(event) => updateRequest({ name: event.target.value })}
        />
        <input
          className="h-11 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
          placeholder="Description"
          value={request.description}
          onChange={(event) => updateRequest({ description: event.target.value })}
        />
      </div>

      <div className="mt-4 space-y-3">
        <Section
          title="Query Params"
          isOpen={sections.query}
          onToggle={() => setSections((prev) => ({ ...prev, query: !prev.query }))}
        >
          <div className="space-y-2">
            {request.queryParams.map((pair, index) => (
              <div key={`query-${index}`} className="flex gap-2">
                <input
                  className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Key"
                  value={pair.key}
                  onChange={(event) =>
                    updatePairList('queryParams', index, { key: event.target.value })
                  }
                />
                <input
                  className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Value"
                  value={pair.value}
                  onChange={(event) =>
                    updatePairList('queryParams', index, { value: event.target.value })
                  }
                />
                <button
                  className="h-10 rounded-lg bg-gray-800 px-3 text-xs"
                  onClick={() => removePair('queryParams', index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="h-10 rounded-lg border border-dashed border-gray-700 px-3 text-xs text-gray-300"
              onClick={() => addPair('queryParams')}
            >
              + Add param
            </button>
          </div>
        </Section>

        <Section
          title="Headers"
          isOpen={sections.headers}
          onToggle={() => setSections((prev) => ({ ...prev, headers: !prev.headers }))}
        >
          <div className="space-y-2">
            {request.headers.map((pair, index) => (
              <div key={`header-${index}`} className="flex gap-2">
                <input
                  className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Header"
                  value={pair.key}
                  onChange={(event) =>
                    updatePairList('headers', index, { key: event.target.value })
                  }
                />
                <input
                  className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Value"
                  value={pair.value}
                  onChange={(event) =>
                    updatePairList('headers', index, { value: event.target.value })
                  }
                />
                <button
                  className="h-10 rounded-lg bg-gray-800 px-3 text-xs"
                  onClick={() => removePair('headers', index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="h-10 rounded-lg border border-dashed border-gray-700 px-3 text-xs text-gray-300"
              onClick={() => addPair('headers')}
            >
              + Add header
            </button>
          </div>
        </Section>

        <Section
          title="Body"
          isOpen={sections.body}
          onToggle={() => setSections((prev) => ({ ...prev, body: !prev.body }))}
        >
          <div className="flex flex-wrap gap-2">
            {['json', 'raw', 'form-data'].map((type) => (
              <button
                key={type}
                className={`h-9 rounded-lg px-3 text-xs ${
                  request.bodyType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
                onClick={() => updateRequest({ bodyType: type })}
              >
                {type === 'form-data' ? 'Form Data' : type.toUpperCase()}
              </button>
            ))}
          </div>
          {request.bodyType === 'form-data' ? (
            <div className="mt-3 space-y-2">
              {request.formData.map((pair, index) => (
                <div key={`form-${index}`} className="flex gap-2">
                  <input
                    className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                    placeholder="Key"
                    value={pair.key}
                    onChange={(event) =>
                      updatePairList('formData', index, { key: event.target.value })
                    }
                  />
                  <input
                    className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                    placeholder="Value"
                    value={pair.value}
                    onChange={(event) =>
                      updatePairList('formData', index, { value: event.target.value })
                    }
                  />
                  <button
                    className="h-10 rounded-lg bg-gray-800 px-3 text-xs"
                    onClick={() => removePair('formData', index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="h-10 rounded-lg border border-dashed border-gray-700 px-3 text-xs text-gray-300"
                onClick={() => addPair('formData')}
              >
                + Add field
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                className="min-h-[140px] w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 font-mono text-xs"
                placeholder={
                  request.bodyType === 'json'
                    ? '{ "key": "value" }'
                    : 'Raw body'
                }
                value={request.body}
                onChange={(event) => updateRequest({ body: event.target.value })}
              />
              {requestErrors.body && (
                <span className="text-xs text-red-400">{requestErrors.body}</span>
              )}
            </div>
          )}
        </Section>

        <Section
          title="Auth"
          isOpen={sections.auth}
          onToggle={() => setSections((prev) => ({ ...prev, auth: !prev.auth }))}
        >
          <div className="space-y-2">
            <select
              className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
              value={request.auth.type}
              onChange={(event) =>
                updateRequest({
                  auth: { ...request.auth, type: event.target.value }
                })
              }
            >
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>
            {request.auth.type === 'bearer' && (
              <input
                className="h-10 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                placeholder="Bearer token"
                value={request.auth.token}
                onChange={(event) =>
                  updateRequest({
                    auth: { ...request.auth, token: event.target.value }
                  })
                }
              />
            )}
            {request.auth.type === 'basic' && (
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Username"
                  value={request.auth.username}
                  onChange={(event) =>
                    updateRequest({
                      auth: { ...request.auth, username: event.target.value }
                    })
                  }
                />
                <input
                  className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                  placeholder="Password"
                  type="password"
                  value={request.auth.password}
                  onChange={(event) =>
                    updateRequest({
                      auth: { ...request.auth, password: event.target.value }
                    })
                  }
                />
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Save to Collection"
          isOpen={sections.save}
          onToggle={() => setSections((prev) => ({ ...prev, save: !prev.save }))}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
                value={request.collectionId || ''}
                onChange={(event) =>
                  updateRequest({ collectionId: event.target.value })
                }
              >
                <option value="">Select collection</option>
                {state.collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              <button
                className="h-10 rounded-lg border border-dashed border-gray-700 px-3 text-xs text-gray-300"
                onClick={() => {
                  const name = prompt('Collection name');
                  if (name) {
                    const id = createCollection(name);
                    addToast('Collection created', 'success');
                    if (id) {
                      updateRequest({ collectionId: id });
                    }
                  }
                }}
              >
                + New Collection
              </button>
            </div>
            <input
              className="h-10 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm"
              placeholder="Folder (optional)"
              value={request.folder}
              onChange={(event) => updateRequest({ folder: event.target.value })}
            />
            {saveError && <span className="text-xs text-red-400">{saveError}</span>}
            <button
              className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white"
              onClick={handleSave}
            >
              Save Request
            </button>
            <p className="text-xs text-gray-400">
              Tip: Ctrl+S saves, Ctrl+Enter sends.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default RequestBuilder;
