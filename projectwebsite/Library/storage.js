(function (global) {
  'use strict';

  const KEYS = {
    currentUser: 'currentUser',
    notes: 'demo_notes_v2',
    ratings: 'demo_ratings_v1',
    bannedUsers: 'banned_users',
    banAppeals: 'ban_appeals'
  };

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`[CNStorage] Failed to parse "${key}":`, err);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[CNStorage] Failed to save "${key}":`, err);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function clearAll() {
    Object.values(KEYS).forEach(remove);
  }

  global.CNStorage = { KEYS, get, set, remove, clearAll };
})(window);