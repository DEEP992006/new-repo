import React, { useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Collections = ({ onClose }) => {
  const {
    state,
    createCollection,
    renameCollection,
    deleteCollection,
    duplicateRequest,
    deleteRequest,
    setActiveRequest,
    importCollections,
    addToast
  } = useAppContext();
  const [editing, setEditing] = useState(null);
  const fileRef = useRef(null);

  const groupedRequests = useMemo(() => {
    return state.collections.map((collection) => {
      const groups = {};
      collection.requests.forEach((req) => {
        const folder = req.folder?.trim() || 'Unsorted';
        if (!groups[folder]) {
          groups[folder] = [];
        }
        groups[folder].push(req);
      });
      return { ...collection, groups };
    });
  }, [state.collections]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state.collections, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'collections.json';
    link.click();
    URL.revokeObjectURL(url);
    addToast('Collections exported', 'success');
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid JSON');
      }
      importCollections(parsed);
      addToast('Collections imported', 'success');
    } catch (error) {
      addToast('Import failed', 'error');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Collections</span>
        <div className="flex gap-2">
          <button
            className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
            onClick={handleExport}
          >
            Export
          </button>
          <button
            className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          {onClose && (
            <button
              className="h-9 rounded-lg bg-gray-800 px-3 text-xs"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />

      <div className="mb-3 flex gap-2">
        <button
          className="h-10 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
          onClick={() => {
            const name = prompt('Collection name');
            if (name) {
              createCollection(name);
            }
          }}
        >
          + New Collection
        </button>
      </div>

      <div className="space-y-4">
        {groupedRequests.length === 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-gray-400">
            No collections yet. Create one to save requests.
          </div>
        )}
        {groupedRequests.map((collection) => (
          <div key={collection.id} className="rounded-xl border border-gray-800">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 px-3 py-2">
              {editing === collection.id ? (
                <input
                  className="h-9 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-2 text-xs"
                  defaultValue={collection.name}
                  onBlur={(event) => {
                    renameCollection(collection.id, event.target.value || collection.name);
                    setEditing(null);
                  }}
                  autoFocus
                />
              ) : (
                <span className="text-sm font-semibold">{collection.name}</span>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  className="h-8 rounded-lg bg-gray-800 px-2 text-xs"
                  onClick={() => setEditing(collection.id)}
                >
                  Rename
                </button>
                <button
                  className="h-8 rounded-lg bg-gray-800 px-2 text-xs text-red-300"
                  onClick={() => deleteCollection(collection.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="space-y-3 p-3">
              {Object.keys(collection.groups).length === 0 && (
                <div className="text-xs text-gray-400">No requests yet.</div>
              )}
              {Object.entries(collection.groups).map(([folder, requests]) => (
                <div key={folder} className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-gray-400">
                    {folder}
                  </div>
                  <div className="space-y-2">
                    {requests.map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs"
                      >
                        <div className="min-w-[180px] flex-1">
                          <div className="font-semibold">{req.name}</div>
                          <div className="text-gray-400">
                            {req.method} {req.url}
                          </div>
                        </div>
                        <button
                          className="h-8 rounded-lg bg-blue-600 px-2 text-xs text-white"
                          onClick={() => {
                            setActiveRequest({
                              ...req,
                              id: req.id,
                              collectionId: collection.id
                            });
                            onClose?.();
                          }}
                        >
                          Load
                        </button>
                        <button
                          className="h-8 rounded-lg bg-gray-800 px-2 text-xs"
                          onClick={() => duplicateRequest(collection.id, req.id)}
                        >
                          Duplicate
                        </button>
                        <button
                          className="h-8 rounded-lg bg-gray-800 px-2 text-xs text-red-300"
                          onClick={() => deleteRequest(collection.id, req.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Collections;
