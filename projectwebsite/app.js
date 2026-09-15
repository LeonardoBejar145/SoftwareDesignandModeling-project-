document.addEventListener('DOMContentLoaded', () => {
  // --- SESSION & BAN CHECK ---
  const userSession = JSON.parse(localStorage.getItem('currentUser'));

  if (!userSession) {
    window.location.href = 'login.html';
    return;
  }

  if (isUserBanned(userSession.username)) {
    alert('❌ Your account has been banned.');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    return;
  }

  // Render User Interface Information
  const isProf = userSession.role === 'PROFESSOR';
  const roleLabel = isProf ? '👨‍🏫 Professor' : '👨‍🎓 Student';
  
  document.getElementById('navRoleBadge').textContent = roleLabel;
  document.getElementById('userNameDisplay').textContent = userSession.username;
  document.getElementById('userRoleDisplay').textContent = roleLabel;
  document.getElementById('userAvatar').textContent = userSession.username.charAt(0);
  
  if (isProf) {
    document.getElementById('userAvatar').className = "w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg uppercase";
    
    // Enable Professor Moderation Button
    const modBtn = document.getElementById('modPanelBtn');
    modBtn.classList.remove('hidden');
    updateAppealBadge();

    modBtn.addEventListener('click', openModerationModal);
    document.getElementById('closeModModal').addEventListener('click', closeModerationModal);
  }

  // Logout Action
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });

  // --- POSTING LOGIC ---
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

    const imageData = imageInput.files[0] ? await readFileAsBase64(imageInput.files[0]) : null;
    const fileData = fileInput.files[0] ? {
      name: fileInput.files[0].name,
      content: await readFileAsBase64(fileInput.files[0])
    } : null;

    const newNote = {
      id: Date.now(),
      authorName: userSession.username,
      authorRole: userSession.role,
      title: noteTitle.value,
      content: noteContent.value,
      image: imageData,
      attachment: fileData,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })
    };

    saveNote(newNote);
    noteForm.reset();
    loadNotes();
  });

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  function getNotes() {
    return JSON.parse(localStorage.getItem('demo_notes_v2')) || [];
  }

  function saveNote(note) {
    const notes = getNotes();
    notes.unshift(note);
    localStorage.setItem('demo_notes_v2', JSON.stringify(notes));
  }

// --- RATING SYSTEM --- Thanks leonardo for not telling me you updated the main branch
// Storage shape: { [noteId]: { [username]: 1..5 } }
function getRatings() {
  return JSON.parse(localStorage.getItem('demo_ratings_v1')) || {};
}

function saveRatings(ratings) {
  localStorage.setItem('demo_ratings_v1', JSON.stringify(ratings));
}

function getAverageRating(noteId) {
  const ratings = getRatings();
  const noteRatings = ratings[noteId] || {};
  const values = Object.values(noteRatings);
  if (values.length === 0) return { average: 0, count: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: sum / values.length, count: values.length };
}

function getUserRating(noteId, username) {
  const ratings = getRatings();
  return (ratings[noteId] && ratings[noteId][username]) || 0;
}

function setRating(noteId, username, value) {
  const ratings = getRatings();
  if (!ratings[noteId]) ratings[noteId] = {};
  ratings[noteId][username] = value;
  saveRatings(ratings);
}

function removeRating(noteId, username) {
  const ratings = getRatings();
  if (ratings[noteId]) {
    delete ratings[noteId][username];
    if (Object.keys(ratings[noteId]).length === 0) delete ratings[noteId];
    saveRatings(ratings);
  }
}
  // Load Notes  but slightly more complex for no reason
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

  // --- Sorting ---
  const sortSelect = document.getElementById('sortSelect');
  const sortMode = sortSelect ? sortSelect.value : 'newest';

  if (sortMode === 'highest' || sortMode === 'lowest') {
    notes.sort((a, b) => {
      const aAvg = getAverageRating(a.id).average;
      const bAvg = getAverageRating(b.id).average;
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

    let imageHTML = note.image
      ? `<div class="mt-3"><img src="${note.image}" class="max-h-80 w-full object-cover rounded-md border" alt="Attached Image"></div>`
      : '';

    let fileHTML = note.attachment
      ? `<div class="mt-3 p-2 bg-gray-50 rounded border flex items-center justify-between">
          <span class="text-sm text-gray-700 truncate">📄 ${escapeHTML(note.attachment.name)}</span>
          <a href="${note.attachment.content}" download="${escapeHTML(note.attachment.name)}" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Download</a>
         </div>`
      : '';

    const displayAuthor = note.authorName ? escapeHTML(note.authorName) : "Anonymous";
    const isAuthor = userSession.username === note.authorName;

    const canDelete = isAuthor || isProf;
    const deleteBtnHTML = canDelete
      ? `<button onclick="deleteNote(${note.id})" class="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-200 transition">🗑️ Delete</button>`
      : '';

    const canBanAuthor = isProf && !isNoteFromProf;
    const banBtnHTML = canBanAuthor
      ? `<button onclick="banUser('${escapeHTML(note.authorName)}')" class="text-xs text-gray-500 hover:text-red-600 underline ml-2 font-medium">🚫 Ban User</button>`
      : '';

    // --- Rating UI ---
    const { average, count } = getAverageRating(note.id);
    const userRating = getUserRating(note.id, userSession.username);
    const avgDisplay = count > 0 ? average.toFixed(1) : '—';

    let ratingHTML = '';
    if (isAuthor) {
      // Own post: no stars, just show average
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
          <button
            type="button"
            data-note-id="${note.id}"
            data-value="${i}"
            class="star-btn text-2xl leading-none transition-transform hover:scale-110 ${filled ? 'text-yellow-400' : 'text-gray-300'}"
            title="Rate ${i} star${i > 1 ? 's' : ''}"
          >★</button>`;
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
          <h3 class="font-bold text-lg text-gray-800">${escapeHTML(note.title)}</h3>
          <span class="text-xs text-gray-400">${note.date}</span>
        </div>
        ${deleteBtnHTML}
      </div>
      <p class="text-gray-700 whitespace-pre-line">${escapeHTML(note.content)}</p>
      ${imageHTML}
      ${fileHTML}
      ${ratingHTML}
    `;
    feed.appendChild(noteElement);
  });

  // --- Wire up star clicks ---
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const noteId = Number(btn.dataset.noteId);
      const value = Number(btn.dataset.value);
      const current = getUserRating(noteId, userSession.username);

      if (current === value) {
        removeRating(noteId, userSession.username); // click same star = clear, like in yelp
      } else {
        setRating(noteId, userSession.username, value);
      }
      loadNotes();
    });
  });
}

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // --- GLOBAL MODERATION FUNCTIONS ---

 window.deleteNote = function(id) {
  if (confirm('Are you sure you want to delete this post?')) {
    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('demo_notes_v2', JSON.stringify(notes));

    // Clean up ratings for this note
    const ratings = getRatings();
    delete ratings[id];
    saveRatings(ratings);

    loadNotes();
  }
};

  window.banUser = function(usernameToBan) {
    if (confirm(`Are you sure you want to BAN ${usernameToBan}? They will lose access immediately.`)) {
      let bannedUsers = JSON.parse(localStorage.getItem('banned_users')) || [];
      
      if (!bannedUsers.includes(usernameToBan)) {
        bannedUsers.push(usernameToBan);
        localStorage.setItem('banned_users', JSON.stringify(bannedUsers));
      }

      alert(`User ${usernameToBan} has been banned.`);
      loadNotes();
      updateAppealBadge();
    }
  };

  // Unban User Function (UC-10: Unban User)[cite: 1]
  window.unbanUser = function(usernameToUnban) {
    let bannedUsers = JSON.parse(localStorage.getItem('banned_users')) || [];
    bannedUsers = bannedUsers.filter(user => user !== usernameToUnban);
    localStorage.setItem('banned_users', JSON.stringify(bannedUsers));

    // Remove pending appeal
    let appeals = JSON.parse(localStorage.getItem('ban_appeals')) || [];
    appeals = appeals.filter(a => a.username !== usernameToUnban);
    localStorage.setItem('ban_appeals', JSON.stringify(appeals));

    alert(`User ${usernameToUnban} has been successfully UNBANNED.`);
    openModerationModal();
    updateAppealBadge();
  };

  function isUserBanned(username) {
    const bannedUsers = JSON.parse(localStorage.getItem('banned_users')) || [];
    return bannedUsers.includes(username);
  }

  function updateAppealBadge() {
    const appeals = JSON.parse(localStorage.getItem('ban_appeals')) || [];
    document.getElementById('appealCount').textContent = appeals.length;
  }

  function openModerationModal() {
    const appeals = JSON.parse(localStorage.getItem('ban_appeals')) || [];
    const bannedUsers = JSON.parse(localStorage.getItem('banned_users')) || [];
    const container = document.getElementById('appealsList');
    
    container.innerHTML = '';

    if (bannedUsers.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 py-4">No banned users currently.</p>`;
    } else {
      bannedUsers.forEach(bannedName => {
        const userAppeal = appeals.find(a => a.username === bannedName);
        const card = document.createElement('div');
        card.className = "p-3 border rounded-lg bg-gray-50 space-y-2";
        
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="font-bold text-gray-800">${escapeHTML(bannedName)}</span>
            <button onclick="unbanUser('${escapeHTML(bannedName)}')" class="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded font-bold transition">
              Unban User
            </button>
          </div>
          <p class="text-xs text-gray-600 bg-white p-2 rounded border italic">
            ${userAppeal ? `"${escapeHTML(userAppeal.reason)}"` : 'No appeal submitted yet.'}
          </p>
          ${userAppeal ? `<span class="text-[10px] text-gray-400 block text-right">${userAppeal.date}</span>` : ''}
        `;
        container.appendChild(card);
      });
    }

    document.getElementById('modModal').classList.remove('hidden');
  }

  function closeModerationModal() {
    document.getElementById('modModal').classList.add('hidden');
  }
// Handle sorting dropdown change
  const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', loadNotes);
}
});
