const STORAGE_KEY = 'apiTesterState';

export const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createDefaultState = () => {
  const envId = createId();
  return {
    collections: [],
    environments: [
      {
        id: envId,
        name: 'Development',
        variables: [{ key: 'baseUrl', value: '' }]
      }
    ],
    history: [],
    activeEnvironmentId: envId,
    activeRequest: {
      id: createId(),
      name: '',
      description: '',
      folder: '',
      collectionId: '',
      method: 'GET',
      url: '',
      queryParams: [{ key: '', value: '' }],
      headers: [{ key: '', value: '' }],
      body: '',
      bodyType: 'json',
      formData: [{ key: '', value: '' }],
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: ''
      }
    }
  };
};

export const loadState = () => {
  const defaults = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    const merged = {
      ...defaults,
      ...parsed,
      activeRequest: {
        ...defaults.activeRequest,
        ...(parsed.activeRequest || {})
      }
    };
    if (
      !merged.environments.find((env) => env.id === merged.activeEnvironmentId)
    ) {
      merged.activeEnvironmentId = merged.environments[0]?.id || defaults.activeEnvironmentId;
    }
    return merged;
  } catch (error) {
    console.error('Failed to load saved state.', error);
    return defaults;
  }
};

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state.', error);
  }
};
