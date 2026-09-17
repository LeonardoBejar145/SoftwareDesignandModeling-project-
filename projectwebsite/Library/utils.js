(function (global) {
  'use strict';

  /** Escape user-supplied text before injecting into innerHTML. */
  function escapeHTML(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /** Unique id based on current timestamp. */
  function uid() {
    return Date.now();
  }

  /** Format a date for display in the feed. */
  function formatDate(d = new Date()) {
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /** Read a File/Blob and resolve with a Base64 data URL. */
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  global.CNUtils = { escapeHTML, uid, formatDate, readFileAsBase64 };
})(window);