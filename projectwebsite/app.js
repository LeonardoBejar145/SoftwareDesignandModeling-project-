document.addEventListener('DOMContentLoaded', () => {
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

    // Read attached files if present
    const imageData = imageInput.files[0] ? await readFileAsBase64(imageInput.files[0]) : null;
    const fileData = fileInput.files[0] ? {
      name: fileInput.files[0].name,
      content: await readFileAsBase64(fileInput.files[0])
    } : null;

    const newNote = {
      id: Date.now(),
      title: noteTitle.value,
      content: noteContent.value,
      image: imageData,
      attachment: fileData,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    saveNote(newNote);
    noteForm.reset();
    loadNotes();
  });

  // Convert File object to Base64 string for localStorage storage
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Get notes stored in browser
  function getNotes() {
    return JSON.parse(localStorage.getItem('demo_notes_v2')) || [];
  }

  // Save note to browser memory
  function saveNote(note) {
    const notes = getNotes();
    notes.unshift(note);
    localStorage.setItem('demo_notes_v2', JSON.stringify(notes));
  }

  // Render notes in Facebook-like feed layout
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
      noteElement.className = 'bg-white rounded-lg shadow p-4 border-l-4 border-blue-500';
      
      let imageHTML = note.image 
        ? `<div class="mt-3"><img src="${note.image}" class="max-h-80 w-full object-cover rounded-md border" alt="Attached Image"></div>` 
        : '';

      let fileHTML = note.attachment 
        ? `<div class="mt-3 p-2 bg-gray-50 rounded border flex items-center justify-between">
            <span class="text-sm text-gray-700 truncate">📄 ${escapeHTML(note.attachment.name)}</span>
            <a href="${note.attachment.content}" download="${escapeHTML(note.attachment.name)}" class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Download</a>
           </div>` 
        : '';

      noteElement.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="font-bold text-lg text-gray-800">${escapeHTML(note.title)}</h3>
            <span class="text-xs text-gray-400">${note.date}</span>
          </div>
          <button onclick="deleteNote(${note.id})" class="text-red-400 hover:text-red-600 text-sm font-medium">
            Delete
          </button>
        </div>
        <p class="text-gray-700 whitespace-pre-line">${escapeHTML(note.content)}</p>
        ${imageHTML}
        ${fileHTML}
      `;
      feed.appendChild(noteElement);
    });
  }

  // Sanitize input to prevent HTML injection
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Remove a post from feed
  window.deleteNote = function(id) {
    let notes = getNotes();
    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('demo_notes_v2', JSON.stringify(notes));
    loadNotes();
  };
});