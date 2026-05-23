import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Environment = () => {
  const {
    state,
    setActiveEnvironment,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment
  } = useAppContext();
  const [editing, setEditing] = useState(null);

  const activeId = state.activeEnvironmentId;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Environments</span>
        <button
          className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white"
          onClick={() => {
            const name = prompt('Environment name');
            if (name) {
              createEnvironment(name);
            }
          }}
        >
          + New
        </button>
      </div>

      <div className="space-y-3">
        {state.environments.map((env) => (
          <div key={env.id} className="rounded-xl border border-gray-800">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 px-3 py-2">
              {editing === env.id ? (
                <input
                  className="h-9 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-2 text-xs"
                  defaultValue={env.name}
                  autoFocus
                  onBlur={(event) => {
                    updateEnvironment(env.id, (prev) => ({
                      ...prev,
                      name: event.target.value || prev.name
                    }));
                    setEditing(null);
                  }}
                />
              ) : (
                <button
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    activeId === env.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}
                  onClick={() => setActiveEnvironment(env.id)}
                >
                  {env.name}
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  className="h-8 rounded-lg bg-gray-800 px-2 text-xs"
                  onClick={() => setEditing(env.id)}
                >
                  Rename
                </button>
                <button
                  className="h-8 rounded-lg bg-gray-800 px-2 text-xs text-red-300"
                  onClick={() => deleteEnvironment(env.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {env.variables.map((variable, index) => (
                <div key={`${env.id}-${index}`} className="flex gap-2">
                  <input
                    className="h-9 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-2 text-xs"
                    placeholder="Key"
                    value={variable.key}
                    onChange={(event) =>
                      updateEnvironment(env.id, (prev) => {
                        const next = [...prev.variables];
                        next[index] = { ...next[index], key: event.target.value };
                        return { ...prev, variables: next };
                      })
                    }
                  />
                  <input
                    className="h-9 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-2 text-xs"
                    placeholder="Value"
                    value={variable.value}
                    onChange={(event) =>
                      updateEnvironment(env.id, (prev) => {
                        const next = [...prev.variables];
                        next[index] = { ...next[index], value: event.target.value };
                        return { ...prev, variables: next };
                      })
                    }
                  />
                  <button
                    className="h-9 rounded-lg bg-gray-800 px-2 text-xs"
                    onClick={() =>
                      updateEnvironment(env.id, (prev) => {
                        const next = prev.variables.filter((_, idx) => idx !== index);
                        return {
                          ...prev,
                          variables: next.length ? next : [{ key: '', value: '' }]
                        };
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="h-9 rounded-lg border border-dashed border-gray-700 px-3 text-xs text-gray-300"
                onClick={() =>
                  updateEnvironment(env.id, (prev) => ({
                    ...prev,
                    variables: [...prev.variables, { key: '', value: '' }]
                  }))
                }
              >
                + Add variable
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Environment;
