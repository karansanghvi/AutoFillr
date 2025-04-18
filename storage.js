export const storage = {
    set: async (key, value) => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        return new Promise(resolve =>
          chrome.storage.local.set({ [key]: value }, resolve)
        );
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    get: async (key) => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        return new Promise(resolve =>
          chrome.storage.local.get(key, (result) => {
            resolve(result[key] ?? null);
          })
        );
      } else {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      }
    }
};      