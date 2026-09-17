(function (global) {
  'use strict';

  const DEFAULTS = {
    storageKey: 'cn_ratings',
    storage: null            // resolved lazily to window.CNStorage if available
  };

  const config = { ...DEFAULTS };

  function resolveStorage() {
    if (config.storage) return config.storage;
    if (global.CNStorage) return global.CNStorage;
    // Fall back to raw localStorage so the library works standalone too.
    return {
      get: (k, d = null) => {
        try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; }
        catch { return d; }
      },
      set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
    };
  }

  function configure(opts = {}) {
    Object.assign(config, opts);
  }

  function readAll() {
    const s = resolveStorage();
    return s.get(config.storageKey, {}) || {};
  }

  function writeAll(data) {
    const s = resolveStorage();
    s.set(config.storageKey, data);
  }

  function assertValue(value) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new RangeError('Rating value must be an integer between 1 and 5.');
    }
  }

  function set(itemId, userId, value) {
    assertValue(value);
    const all = readAll();
    if (!all[itemId]) all[itemId] = {};
    all[itemId][userId] = value;
    writeAll(all);
  }

  function remove(itemId, userId) {
    const all = readAll();
    if (!all[itemId]) return;
    delete all[itemId][userId];
    if (Object.keys(all[itemId]).length === 0) delete all[itemId];
    writeAll(all);
  }

  function get(itemId, userId) {
    const all = readAll();
    return (all[itemId] && all[itemId][userId]) || 0;
  }

  function average(itemId) {
    const all = readAll();
    const bucket = all[itemId] || {};
    const values = Object.values(bucket);
    if (values.length === 0) return { average: 0, count: 0 };
    const sum = values.reduce((a, b) => a + b, 0);
    return { average: sum / values.length, count: values.length };
  }

  function clearItem(itemId) {
    const all = readAll();
    delete all[itemId];
    writeAll(all);
  }

  function clearAll() {
    writeAll({});
  }

  /** If the user clicks the star they already chose, remove it. */
  function toggle(itemId, userId, value) {
    const current = get(itemId, userId);
    if (current === value) {
      remove(itemId, userId);
      return 0;
    }
    set(itemId, userId, value);
    return value;
  }

  global.CNRatings = {
    configure,
    set, remove, get, average,
    clearItem, clearAll, toggle
  };
})(window);