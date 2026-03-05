// =============================================
//  BOOKSHELF APP — main.js
//  Dicoding: Belajar Membuat Front-End Web untuk Pemula
// =============================================

const STORAGE_KEY = "BOOKSHELF_APPS";

// =============================================
//  DATA LAYER
// =============================================

/** @type {Array<{id: number, title: string, author: string, year: number, isComplete: boolean}>} */
let books = [];

/** Load books array from localStorage into memory */
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      books = JSON.parse(raw);
    } catch {
      books = [];
    }
  }
}

/** Persist the current books array to localStorage */
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

// =============================================
//  TOAST NOTIFICATION
//  Menggantikan alert() bawaan browser
// =============================================

/**
 * Tampilkan toast notification yang hilang otomatis setelah 3 detik (BOM setTimeout).
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // BOM setTimeout → auto-dismiss setelah 3 detik
  setTimeout(() => {
    toast.classList.add("toast-hide");
    toast.addEventListener("animationend", () => toast.remove(), {
      once: true,
    });
  }, 3000);
}

// =============================================
//  MODAL KONFIRMASI HAPUS (Custom Event)
// =============================================

/** @type {Function|null} Callback saat user klik "Ya, Hapus" */
let _confirmCallback = null;

/**
 * Tampilkan modal konfirmasi custom.
 * @param {string} bookTitle
 * @param {Function} onConfirm
 */
function showConfirmModal(bookTitle, onConfirm) {
  _confirmCallback = onConfirm;
  document.getElementById("confirmModalTitle").textContent =
    `Hapus "${bookTitle}"?`;
  document.getElementById("confirmModalMessage").textContent =
    "Tindakan ini tidak dapat dibatalkan.";
  document.getElementById("confirmModal").classList.add("open");
}

/** Tutup modal konfirmasi */
function hideConfirmModal() {
  document.getElementById("confirmModal").classList.remove("open");
  _confirmCallback = null;
}

// =============================================
//  COUNTER BADGE
// =============================================

/** Update angka badge di heading kedua rak */
function updateCounters() {
  const completed = books.filter((b) => b.isComplete).length;
  const unread = books.length - completed;

  document.getElementById("incompleteCount").textContent = unread;
  document.getElementById("completeCount").textContent = completed;
}

// =============================================
//  ANIMASI DOM
// =============================================

/**
 * Animasi keluar lalu hapus element dari DOM.
 * @param {HTMLElement} el
 * @param {Function} [callback]
 */
function removeBookWithAnimation(el, callback) {
  el.classList.add("book-exit");
  el.addEventListener(
    "animationend",
    () => {
      el.remove();
      if (callback) callback();
    },
    { once: true },
  );
}

// =============================================
//  UI LAYER
// =============================================

/**
 * Build the DOM element for a single book.
 * All data-testid attributes are preserved exactly as required.
 * @param {{ id: number, title: string, author: string, year: number, isComplete: boolean }} book
 * @returns {HTMLElement}
 */
function createBookElement(book) {
  // Container
  const item = document.createElement("div");
  item.setAttribute("data-bookid", book.id);
  item.setAttribute("data-testid", "bookItem");

  // #1 — Animasi masuk
  item.classList.add("book-enter");

  // Title
  const title = document.createElement("h3");
  title.setAttribute("data-testid", "bookItemTitle");
  title.textContent = book.title;

  // Author
  const author = document.createElement("p");
  author.setAttribute("data-testid", "bookItemAuthor");
  author.textContent = `Penulis: ${book.author}`;

  // Year
  const year = document.createElement("p");
  year.setAttribute("data-testid", "bookItemYear");
  year.textContent = `Tahun: ${book.year}`;

  // Action buttons wrapper
  const actions = document.createElement("div");
  actions.classList.add("book-actions");

  // Toggle complete button
  const toggleBtn = document.createElement("button");
  toggleBtn.setAttribute("data-testid", "bookItemIsCompleteButton");
  toggleBtn.textContent = book.isComplete
    ? "Belum selesai dibaca"
    : "Selesai dibaca";
  toggleBtn.addEventListener("click", () =>
    handleToggleComplete(book.id, item),
  );

  // Delete button — #3 dispatch Custom Event
  const deleteBtn = document.createElement("button");
  deleteBtn.setAttribute("data-testid", "bookItemDeleteButton");
  deleteBtn.textContent = "Hapus buku";
  deleteBtn.addEventListener("click", () => {
    const event = new CustomEvent("book:delete", {
      detail: { bookId: book.id, bookTitle: book.title },
      bubbles: true,
    });
    deleteBtn.dispatchEvent(event);
  });

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.setAttribute("data-testid", "bookItemEditButton");
  editBtn.textContent = "Edit buku";
  editBtn.addEventListener("click", () => handleOpenEdit(book.id));

  actions.append(toggleBtn, deleteBtn, editBtn);
  item.append(title, author, year, actions);

  return item;
}

/**
 * Re-render both shelves. Optionally filters by query string (title search).
 * @param {string} [query='']
 */
function renderBooks(query = "") {
  const incompleteList = document.getElementById("incompleteBookList");
  const completeList = document.getElementById("completeBookList");

  incompleteList.innerHTML = "";
  completeList.innerHTML = "";

  const lowerQuery = query.trim().toLowerCase();

  const filtered = lowerQuery
    ? books.filter((b) => b.title.toLowerCase().includes(lowerQuery))
    : books;

  const incomplete = filtered.filter((b) => !b.isComplete);
  const complete = filtered.filter((b) => b.isComplete);

  if (incomplete.length === 0) {
    incompleteList.innerHTML =
      '<div class="empty-shelf">Tidak ada buku di rak ini</div>';
  } else {
    incomplete.forEach((book) =>
      incompleteList.appendChild(createBookElement(book)),
    );
  }

  if (complete.length === 0) {
    completeList.innerHTML =
      '<div class="empty-shelf">Tidak ada buku di rak ini</div>';
  } else {
    complete.forEach((book) =>
      completeList.appendChild(createBookElement(book)),
    );
  }

  // #6 — Selalu update counter setelah render
  updateCounters();
}

// =============================================
//  EVENT HANDLERS
// =============================================

/**
 * Handle "Tambah Buku" form submission.
 * @param {SubmitEvent} event
 */
function handleAddBook(event) {
  event.preventDefault();

  const title = document.getElementById("bookFormTitle").value.trim();
  const author = document.getElementById("bookFormAuthor").value.trim();
  const year = parseInt(document.getElementById("bookFormYear").value, 10);
  const isComplete = document.getElementById("bookFormIsComplete").checked;

  if (!title || !author || isNaN(year)) return;

  /** @type {{id: number, title: string, author: string, year: number, isComplete: boolean}} */
  const newBook = {
    id: Number(new Date()),
    title,
    author,
    year,
    isComplete,
  };

  books.push(newBook);
  saveToStorage();
  renderBooks(getCurrentSearchQuery());

  // Reset form fields
  event.target.reset();
  updateSubmitButtonLabel();
  clearYearValidation();

  // #4 — Toast konfirmasi
  showToast(`"${title}" berhasil ditambahkan ke rak!`);
}

/**
 * Toggle a book's isComplete status.
 * @param {number} bookId
 * @param {HTMLElement} [el] — elemen card untuk animasi exit sebelum re-render
 */
function handleToggleComplete(bookId, el) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  const doToggle = () => {
    book.isComplete = !book.isComplete;
    saveToStorage();
    renderBooks(getCurrentSearchQuery());
    const shelf = book.isComplete ? "Selesai dibaca" : "Belum selesai dibaca";
    showToast(`Buku dipindah ke rak "${shelf}"`, "info");
  };

  // #1 — Animasi exit sebelum pindah rak
  if (el) {
    removeBookWithAnimation(el, doToggle);
  } else {
    doToggle();
  }
}

/**
 * Delete a book — triggered by custom "book:delete" event listener.
 * @param {number} bookId
 */
function deleteBook(bookId) {
  const book = books.find((b) => b.id === bookId);
  const titleSnap = book ? book.title : "";

  // Find card element for exit animation
  const el = document.querySelector(`[data-bookid="${bookId}"]`);

  const doDelete = () => {
    books = books.filter((b) => b.id !== bookId);
    saveToStorage();
    renderBooks(getCurrentSearchQuery());
    showToast(`"${titleSnap}" berhasil dihapus.`, "error");
  };

  if (el) {
    removeBookWithAnimation(el, doDelete);
  } else {
    doDelete();
  }
}

// =============================================
//  EDIT MODAL
// =============================================

/** @type {number|null} */
let editingBookId = null;

/**
 * Open the edit modal pre-filled with the book's current data.
 * @param {number} bookId
 */
function handleOpenEdit(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  editingBookId = bookId;

  document.getElementById("editBookId").value = book.id;
  document.getElementById("editBookTitle").value = book.title;
  document.getElementById("editBookAuthor").value = book.author;
  document.getElementById("editBookYear").value = book.year;
  document.getElementById("editBookIsComplete").checked = book.isComplete;

  document.getElementById("editModal").classList.add("open");
  document.getElementById("editBookTitle").focus();
}

/** Close the edit modal */
function handleCloseEdit() {
  document.getElementById("editModal").classList.remove("open");
  editingBookId = null;
}

/**
 * Save the edited book data.
 * @param {SubmitEvent} event
 */
function handleSaveEdit(event) {
  event.preventDefault();

  if (editingBookId === null) return;

  const book = books.find((b) => b.id === editingBookId);
  if (!book) {
    handleCloseEdit();
    return;
  }

  const title = document.getElementById("editBookTitle").value.trim();
  const author = document.getElementById("editBookAuthor").value.trim();
  const year = parseInt(document.getElementById("editBookYear").value, 10);
  const isComplete = document.getElementById("editBookIsComplete").checked;

  if (!title || !author || isNaN(year)) return;

  book.title = title;
  book.author = author;
  book.year = year;
  book.isComplete = isComplete;

  saveToStorage();
  renderBooks(getCurrentSearchQuery());
  handleCloseEdit();

  // #4 — Toast konfirmasi edit
  showToast(`"${title}" berhasil diperbarui.`, "success");
}

// =============================================
//  SEARCH
// =============================================

/** Get the current value from the search input */
function getCurrentSearchQuery() {
  return document.getElementById("searchBookTitle").value;
}

/**
 * Handle search form submit.
 * @param {SubmitEvent} event
 */
function handleSearch(event) {
  event.preventDefault();
  renderBooks(getCurrentSearchQuery());
}

// =============================================
//  DYNAMIC SUBMIT BUTTON LABEL
// =============================================

function updateSubmitButtonLabel() {
  const isComplete = document.getElementById("bookFormIsComplete").checked;
  const span = document.querySelector("#bookFormSubmit span");
  if (span) {
    span.textContent = isComplete ? "Selesai dibaca" : "Belum selesai dibaca";
  }
}

// =============================================
//  VALIDASI FORM REAL-TIME
// =============================================

function clearYearValidation() {
  const input = document.getElementById("bookFormYear");
  const errEl = document.getElementById("yearError");
  input.classList.remove("input-valid", "input-invalid");
  if (errEl) errEl.textContent = "";
}

function setupYearValidation() {
  const input = document.getElementById("bookFormYear");
  const errEl = document.getElementById("yearError");
  const currentYear = new Date().getFullYear();

  // Reset saat input mendapat fokus
  input.addEventListener("focus", () => {
    input.classList.remove("input-valid", "input-invalid");
    if (errEl) errEl.textContent = "";
  });

  // Validasi real-time saat mengetik
  input.addEventListener("input", () => {
    const val = Number(input.value);
    if (!input.value) {
      input.classList.remove("input-valid", "input-invalid");
      if (errEl) errEl.textContent = "";
      return;
    }
    const isValid = Number.isInteger(val) && val > 0 && val <= currentYear;
    input.classList.toggle("input-valid", isValid);
    input.classList.toggle("input-invalid", !isValid);
    if (errEl) {
      errEl.textContent = isValid
        ? ""
        : `Masukkan tahun antara 1 – ${currentYear}.`;
    }
  });

  // Revalidasi saat blur (keluar dari field)
  input.addEventListener("blur", () => {
    if (!input.value) {
      input.classList.add("input-invalid");
      if (errEl) errEl.textContent = "Tahun wajib diisi!";
    }
  });
}

// =============================================
//  INIT
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  // Load data
  loadFromStorage();
  renderBooks();

  // Add book form
  document.getElementById("bookForm").addEventListener("submit", handleAddBook);

  // Search form — submit
  document
    .getElementById("searchBook")
    .addEventListener("submit", handleSearch);

  // Search input — real-time filtering
  document.getElementById("searchBookTitle").addEventListener("input", () => {
    renderBooks(getCurrentSearchQuery());
  });

  // Dynamic submit button label
  document
    .getElementById("bookFormIsComplete")
    .addEventListener("change", updateSubmitButtonLabel);

  // Edit modal — save
  document
    .getElementById("editBookForm")
    .addEventListener("submit", handleSaveEdit);

  // Edit modal — cancel button
  document
    .getElementById("editFormCancel")
    .addEventListener("click", handleCloseEdit);

  // Edit modal — close on backdrop click
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("editModal")) handleCloseEdit();
  });

  // #3 — Custom Event "book:delete" → tampilkan modal konfirmasi
  document.addEventListener("book:delete", (e) => {
    const { bookId, bookTitle } = e.detail;
    showConfirmModal(bookTitle, () => deleteBook(bookId));
  });

  // #3 — Modal konfirmasi: tombol "Ya, Hapus"
  document.getElementById("confirmYes").addEventListener("click", () => {
    if (_confirmCallback) _confirmCallback();
    hideConfirmModal();
  });

  // #3 — Modal konfirmasi: tombol "Batal"
  document
    .getElementById("confirmNo")
    .addEventListener("click", hideConfirmModal);

  // #3 — Modal konfirmasi: close on backdrop click
  document.getElementById("confirmModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("confirmModal"))
      hideConfirmModal();
  });

  // #2 — Setup validasi real-time pada field tahun
  setupYearValidation();

  // #7 — Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+F → fokus ke input pencarian
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      document.getElementById("searchBookTitle").focus();
      document.getElementById("searchBookTitle").select();
    }

    // Escape → tutup modal edit ATAU modal konfirmasi
    if (e.key === "Escape") {
      if (document.getElementById("confirmModal").classList.contains("open")) {
        hideConfirmModal();
      } else {
        handleCloseEdit();
      }
    }
  });

  // Set initial submit button label
  updateSubmitButtonLabel();
});
