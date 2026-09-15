document.addEventListener('DOMContentLoaded', () => {
  // --- SESSION LOGIC ---
  const userSession = JSON.parse(localStorage.getItem('currentUser'));

  // Redirect to login if no active session
  if (!userSession) {
    window.location.href = 'login.html';
    return;
  }

  // Display user info in UI
  const isProf = userSession.role === 'PROFESSOR';
  const roleLabel = isProf ? '👨‍🏫 Professor' : '👨‍🎓 Student';
  
  document.getElementById('navRoleBadge').textContent = roleLabel;
  document.getElementById('userNameDisplay').textContent = userSession.username;
  document.getElementById('userRoleDisplay').textContent = roleLabel;
  document.getElementById('userAvatar').textContent = userSession.username.charAt(0);
  
  if(isProf) {
    document.getElementById('userAvatar').className = "w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg uppercase";
  }

  // Handle Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });

  // --- YOUR EXISTING POST LOGIC ---
  const noteForm = document.getElementById('noteForm');
  const noteTitle = document.getElementById('noteTitle');
  const noteContent = document.getElementById('noteContent');
  const imageInput = document.getElementById('imageInput');
  const fileInput = document.getElementById('fileInput');
  const feed = document.getElementById('feed');

  // Load saved notes when application starts
  loadNotes();

  // Handle post submission
  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const imageData = imageInput.files[0] ? await readFileAsBase64(imageInput.files[0]) : null;
    const fileData = fileInput.files[0] ? {
      name: fileInput.files[0].name,
      content: await readFileAsBase64(fileInput.files[0])
    } : null;

    const newNote = {
      id: Date.now(),
      authorName: userSession.username, // Save who posted it
      authorRole: userSession.role,     // Save their role
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

  // Render notes with Role identification
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

    notes.forEach(note => {
      const noteElement = document.createElement('div');
      
      // Different border color for Professor vs Student
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

      // Only show delete button if current user is the author (or if they are admin, but let's stick to author for now)
      const isAuthor = userSession.username === note.authorName;
      const deleteBtnHTML = isAuthor 
        ? `<button onclick="deleteNote(${note.id})" class="text-red-400 hover:text-red-600 text-sm font-medium">Delete</button>` 
        : '';

      // Set fallback name for older notes that didn't have authorName saved
      const displayAuthor = note.authorName ? escapeHTML(note.authorName) : "Anonymous";

      noteElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="flex items-center mb-1">
              <span class="font-bold text-sm text-gray-900">${displayAuthor}</span>
              ${note.authorRole ? badgeHTML : ''}
            </div>
            <h3 class="font-bold text-lg text-gray-800">${escapeHTML(note.title)}</h3>
            <span class="text-xs text-gray-400">${note.date}</span>
          </div>
          ${deleteBtnHTML}
        </div>
        <p class="text-gray-700 whitespace-pre-line">${escapeHTML(note.content)}</p>
        ${imageHTML}
        ${fileHTML}
      `;
      feed.appendChild(noteElement);
    });
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  window.deleteNote = function(id) {
    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('demo_notes_v2', JSON.stringify(notes));
    loadNotes();
  };
});
