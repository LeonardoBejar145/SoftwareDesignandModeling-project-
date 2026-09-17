document.addEventListener('DOMContentLoaded', () => {
  // --- SESSION & BAN CHECK ---
  const userSession = CNStorage.get(CNStorage.KEYS.currentUser);

  if (!userSession) {
    window.location.href = 'login.html';
    return;
  }

  if (isUserBanned(userSession.username)) {
    alert('❌ Your account has been banned.');
    CNStorage.remove(CNStorage.KEYS.currentUser);
    window.location.href = 'login.html';
    return;
  }

  // --- RATINGS LIBRARY CONFIGURATION ---
  CNRatings.configure({
    storageKey: CNStorage.KEYS.ratings,
    storage: CNStorage
  });

  // --- USER UI ---
  const isProf = userSession.role === 'PROFESSOR';
  const roleLabel = isProf ? '👨‍🏫 Professor' : '👨‍🎓 Student';

  document.getElementById('navRoleBadge').textContent = roleLabel;
  document.getElementById('userNameDisplay').textContent = userSession.username;
  document.getElementById('userRoleDisplay').textContent = roleLabel;
  document.getElementById('userAvatar').textContent = userSession.username.charAt(0);

  if (isProf) {
    document.getElementById('userAvatar').className =
      "w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg uppercase";

    const modBtn = document.getElementById('modPanelBtn');
    modBtn.classList.remove('hidden');
    updateAppealBadge();
    modBtn.addEventListener('click', openModerationModal);
    document.getElementById('closeModModal').addEventListener('click', closeModerationModal);
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    CNStorage.remove(CNStorage.KEYS.currentUser);
    window.location.href = 'login.html';
  });

  // --- POSTING ---
  const noteForm = document.getElementById('noteForm');
  const noteTitle = document.getElementById('noteTitle');
  const noteContent = document.getElementById('noteContent');
  const imageInput = document.getElementById('imageInput');
  const fileInput = document.getElementById('fileInput');
  const feed = document.getElementById('feed');

  loadNotes();

  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isUserBanned(userSession.username)) {
      alert('You cannot post because your account is suspended.');
      return;
    }

    const imageData = imageInput.files[0]
      ? await CNUtils.readFileAsBase64(imageInput.files[0]) : null;

    const fileData = fileInput.files[0] ? {
      name: fileInput.files[0].name,
      content: await CNUtils.readFileAsBase64(fileInput.files[0])
    } : null;

    const newNote = {
      id: CNUtils.uid(),
      authorName: userSession.username,
      authorRole: userSession.role,
      title: noteTitle.value,
      content: noteContent.value,
      image: imageData,
      attachment: fileData,
      date: CNUtils.formatDate()
    };

    saveNote(newNote);
    noteForm.reset();
    loadNotes();
  });

  // --- DATA ACCESS (all via CNStorage) ---
  function getNotes()        { return CNStorage.get(CNStorage.KEYS.notes, []); }
  function saveNotes(notes)  { CNStorage.set(CNStorage.KEYS.notes, notes); }
  function getBanned()       { return CNStorage.get(CNStorage.KEYS.bannedUsers, []); }
  function saveBanned(list)  { CNStorage.set(CNStorage.KEYS.bannedUsers, list); }
  function getAppeals()      { return CNStorage.get(CNStorage.KEYS.banAppeals, []); }
  function saveAppeals(list) { CNStorage.set(CNStorage.KEYS.banAppeals, list); }

  function saveNote(note) {
    const notes = getNotes();
    notes.unshift(note);
    saveNotes(notes);
  }

  function isUserBanned(username) {
    return getBanned().includes(username);
  }

  // --- RENDER FEED ---
  function loadNotes() {
    const notes = getNotes();
    feed.innerHTML = '';

    if (notes.length === 0) {
      feed.innerHTML = `
        <div class="text-center text-gray-500 py-8 bg-white rounded-lg shadow">
          No posts published yet. Create your first class note above!
        </div>`;
      return;
    }

    const sortSelect = document.getElementById('sortSelect');
    const sortMode = sortSelect ? sortSelect.value : 'newest';

    if (sortMode === 'highest' || sortMode === 'lowest') {
      notes.sort((a, b) => {
        const aAvg = CNRatings.average(a.id).average;
        const bAvg = CNRatings.average(b.id).average;
        return sortMode === 'highest' ? bAvg - aAvg : aAvg - bAvg;
      });
    }

    notes.forEach(note => {
      const noteElement = document.createElement('div');
      const isNoteFromProf = note.authorRole === 'PROFESSOR';
      const borderClass = isNoteFromProf ? 'border-purple-500' : 'border-blue-500';
      const badgeHTML = isNoteFromProf
        ? `<span class="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase ml-2">Professor</span>`
        : `<span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase ml-2">Student</span>`;

      noteElement.className = `bg-white rounded-lg shadow p-4 border-l-4 ${borderClass}`;

      const imageHTML = note.image
        ? `<div class="mt-3"><img src="${note.image}" class="max-h-80 w-full object-cover rounded-md border" alt="Attached Image"></div>`
        : '';

      const fileHTML = note.attachment
        ? `<div class="mt-3 p-2 bg-gray-50 rounded border flex items-center justify-between">
             <span class="text-sm text-gray-700 truncate">📄 ${CNUtils.escapeHTML(note.attachment.name)}</span>
             <a href="${note.attachment.content}" download="${CNUtils.escapeHTML(note.attachment.name)}"
                class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Download</a>
           </div>`
        : '';

      const displayAuthor = note.authorName
        ? CNUtils.escapeHTML(note.authorName) : 'Anonymous';
      const isAuthor = userSession.username === note.authorName;

      const canDelete = isAuthor || isProf;
      const deleteBtnHTML = canDelete
        ? `<button onclick="deleteNote(${note.id})" class="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-200 transition">🗑️ Delete</button>`
        : '';

      const canBanAuthor = isProf && !isNoteFromProf;
      const banBtnHTML = canBanAuthor
        ? `<button onclick="banUser('${CNUtils.escapeHTML(note.authorName)}')" class="text-xs text-gray-500 hover:text-red-600 underline ml-2 font-medium">🚫 Ban User</button>`
        : '';

      const { average, count } = CNRatings.average(note.id);
      const userRating = CNRatings.get(note.id, userSession.username);
      const avgDisplay = count > 0 ? average.toFixed(1) : '—';

      let ratingHTML;
      if (isAuthor) {
        ratingHTML = `
          <div class="mt-4 pt-3 border-t flex items-center justify-between">
            <span class="text-xs text-gray-400 italic">You can't rate your own post</span>
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-gray-800">${avgDisplay}</span>
              <span class="text-gray-400">(${count} ${count === 1 ? 'rating' : 'ratings'})</span>
            </div>
          </div>`;
      } else {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
          const filled = i <= userRating;
          starsHTML += `
            <button type="button" data-note-id="${note.id}" data-value="${i}"
              class="star-btn text-2xl leading-none transition-transform hover:scale-110 ${filled ? 'text-yellow-400' : 'text-gray-300'}"
              title="Rate ${i} star${i > 1 ? 's' : ''}">★</button>`;
        }
        ratingHTML = `
          <div class="mt-4 pt-3 border-t flex items-center justify-between">
            <div class="flex items-center gap-1">${starsHTML}</div>
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-gray-800">${avgDisplay}</span>
              <span class="text-gray-400">(${count} ${count === 1 ? 'rating' : 'ratings'})</span>
            </div>
          </div>`;
      }

      noteElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="flex items-center mb-1">
              <span class="font-bold text-sm text-gray-900">${displayAuthor}</span>
              ${note.authorRole ? badgeHTML : ''}
              ${banBtnHTML}
            </div>
            <h3 class="font-bold text-lg text-gray-800">${CNUtils.escapeHTML(note.title)}</h3>
            <span class="text-xs text-gray-400">${note.date}</span>
          </div>
          ${deleteBtnHTML}
        </div>
        <p class="text-gray-700 whitespace-pre-line">${CNUtils.escapeHTML(note.content)}</p>
        ${imageHTML}
        ${fileHTML}
        ${ratingHTML}
      `;
      feed.appendChild(noteElement);
    });

    document.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const noteId = Number(btn.dataset.noteId);
        const value = Number(btn.dataset.value);
        CNRatings.toggle(noteId, userSession.username, value);
        loadNotes();
      });
    });
  }

  // --- GLOBAL ACTIONS ---
  window.deleteNote = function (id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    saveNotes(getNotes().filter(n => n.id !== id));
    CNRatings.clearItem(id);
    loadNotes();
  };

  window.banUser = function (usernameToBan) {
    if (!confirm(`Are you sure you want to BAN ${usernameToBan}? They will lose access immediately.`)) return;

    const banned = getBanned();
    if (!banned.includes(usernameToBan)) {
      banned.push(usernameToBan);
      saveBanned(banned);
    }

    alert(`User ${usernameToBan} has been banned.`);
    loadNotes();
    updateAppealBadge();
  };

  window.unbanUser = function (usernameToUnban) {
    saveBanned(getBanned().filter(u => u !== usernameToUnban));
    saveAppeals(getAppeals().filter(a => a.username !== usernameToUnban));
    alert(`User ${usernameToUnban} has been successfully UNBANNED.`);
    openModerationModal();
    updateAppealBadge();
  };

  // --- MODERATION MODAL ---
  function updateAppealBadge() {
    const count = getAppeals().length;
    document.getElementById('appealCount').textContent = count;
  }

  function openModerationModal() {
    const appeals = getAppeals();
    const banned = getBanned();
    const container = document.getElementById('appealsList');
    container.innerHTML = '';

    if (banned.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 py-4">No banned users currently.</p>`;
    } else {
      banned.forEach(name => {
        const appeal = appeals.find(a => a.username === name);
        const card = document.createElement('div');
        card.className = 'p-3 border rounded-lg bg-gray-50 space-y-2';
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-800">${CNUtils.escapeHTML(name)}</span>
            <button onclick="unbanUser('${CNUtils.escapeHTML(name)}')"
              class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-bold transition">
              Unban User
            </button>
          </div>
          <p class="text-xs text-gray-600 bg-white p-2 rounded border italic">
            ${appeal ? `"${CNUtils.escapeHTML(appeal.reason)}"` : 'No appeal submitted yet.'}
          </p>
          ${appeal ? `<span class="text-[10px] text-gray-400 block text-right">${appeal.date}</span>` : ''}
        `;
        container.appendChild(card);
      });
    }

    document.getElementById('modModal').classList.remove('hidden');
  }

  function closeModerationModal() {
    document.getElementById('modModal').classList.add('hidden');
  }

  // --- SORT DROPDOWN ---
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.addEventListener('change', loadNotes);
});