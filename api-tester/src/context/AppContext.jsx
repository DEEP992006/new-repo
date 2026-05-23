import React, { createContext, useContext, useMemo, useState } from 'react';
import { createDefaultState, createId, loadState, saveState } from '../utils/storage';

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(() => loadState());
  const [toasts, setToasts] = useState([]);

  const persistState = (nextState) => {
    setState(nextState);
    saveState(nextState);
  };

  const addToast = (message, tone = 'info') => {
    const id = createId();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2400);
  };

  const normalizeRequest = (request) => {
    const defaults = createDefaultState().activeRequest;
    const ensurePairs = (pairs) =>
      pairs && pairs.length ? pairs : [{ key: '', value: '' }];
    return {
      ...defaults,
      ...request,
      queryParams: ensurePairs(request.queryParams),
      headers: ensurePairs(request.headers),
      formData: ensurePairs(request.formData),
      auth: { ...defaults.auth, ...(request.auth || {}) }
    };
  };

  const setActiveRequest = (updater) => {
    const next =
      typeof updater === 'function' ? updater(state.activeRequest) : updater;
    persistState({
      ...state,
      activeRequest: normalizeRequest(next)
    });
  };

  const addHistoryItem = (item) => {
    const nextHistory = [item, ...state.history].slice(0, 50);
    persistState({ ...state, history: nextHistory });
  };

  const clearHistory = () => {
    persistState({ ...state, history: [] });
  };

  const setActiveEnvironment = (id) => {
    persistState({ ...state, activeEnvironmentId: id });
  };

  const createEnvironment = (name) => {
    const next = {
      id: createId(),
      name,
      variables: [{ key: 'baseUrl', value: '' }]
    };
    persistState({
      ...state,
      environments: [...state.environments, next],
      activeEnvironmentId: next.id
    });
  };

  const updateEnvironment = (id, updater) => {
    const next = state.environments.map((env) =>
      env.id === id ? updater(env) : env
    );
    persistState({ ...state, environments: next });
  };

  const deleteEnvironment = (id) => {
    const next = state.environments.filter((env) => env.id !== id);
    const active =
      state.activeEnvironmentId === id && next.length > 0
        ? next[0].id
        : state.activeEnvironmentId;
    if (next.length === 0) {
      const defaults = createDefaultState();
      persistState({
        ...state,
        environments: defaults.environments,
        activeEnvironmentId: defaults.activeEnvironmentId
      });
      return;
    }
    persistState({
      ...state,
      environments: next,
      activeEnvironmentId: active
    });
  };

  const createCollection = (name) => {
    const id = createId();
    const next = { id, name, requests: [] };
    persistState({ ...state, collections: [...state.collections, next] });
    return id;
  };

  const renameCollection = (id, name) => {
    const next = state.collections.map((col) =>
      col.id === id ? { ...col, name } : col
    );
    persistState({ ...state, collections: next });
  };

  const deleteCollection = (id) => {
    persistState({
      ...state,
      collections: state.collections.filter((col) => col.id !== id)
    });
  };

  const addRequestToCollection = (collectionId, request) => {
    const next = state.collections.map((col) => {
      if (col.id !== collectionId) {
        return col;
      }
      return {
        ...col,
        requests: [
          ...col.requests,
          {
            ...request,
            id: createId()
          }
        ]
      };
    });
    persistState({ ...state, collections: next });
  };

  const duplicateRequest = (collectionId, requestId) => {
    const next = state.collections.map((col) => {
      if (col.id !== collectionId) {
        return col;
      }
      const target = col.requests.find((req) => req.id === requestId);
      if (!target) {
        return col;
      }
      return {
        ...col,
        requests: [
          ...col.requests,
          {
            ...target,
            id: createId(),
            name: `${target.name || 'Request'} Copy`
          }
        ]
      };
    });
    persistState({ ...state, collections: next });
  };

  const deleteRequest = (collectionId, requestId) => {
    const next = state.collections.map((col) =>
      col.id === collectionId
        ? { ...col, requests: col.requests.filter((req) => req.id !== requestId) }
        : col
    );
    persistState({ ...state, collections: next });
  };

  const importCollections = (collections) => {
    persistState({ ...state, collections });
  };

  const resetState = () => {
    const next = createDefaultState();
    persistState(next);
  };

  const value = useMemo(
    () => ({
      state,
      toasts,
      addToast,
      setActiveRequest,
      addHistoryItem,
      clearHistory,
      setActiveEnvironment,
      createEnvironment,
      updateEnvironment,
      deleteEnvironment,
      createCollection,
      renameCollection,
      deleteCollection,
      addRequestToCollection,
      duplicateRequest,
      deleteRequest,
      importCollections,
      resetState
    }),
    [state, toasts]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
