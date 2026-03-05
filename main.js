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
  toggleBtn.addEventListener("click", () => handleToggleComplete(book.id));

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.setAttribute("data-testid", "bookItemDeleteButton");
  deleteBtn.textContent = "Hapus buku";
  deleteBtn.addEventListener("click", () => handleDeleteBook(book.id));

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
  updateSubmitButtonLabel(); // reset label back to "Belum selesai dibaca"
}

/**
 * Toggle a book's isComplete status.
 * @param {number} bookId
 */
function handleToggleComplete(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  book.isComplete = !book.isComplete;
  saveToStorage();
  renderBooks(getCurrentSearchQuery());
}

/**
 * Delete a book from the array and localStorage.
 * @param {number} bookId
 */
function handleDeleteBook(bookId) {
  const confirmed = window.confirm("Yakin ingin menghapus buku ini?");
  if (!confirmed) return;

  books = books.filter((b) => b.id !== bookId);
  saveToStorage();
  renderBooks(getCurrentSearchQuery());
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
//  Reflects whether the book will go into
//  "Selesai dibaca" or "Belum selesai dibaca"
// =============================================

function updateSubmitButtonLabel() {
  const isComplete = document.getElementById("bookFormIsComplete").checked;
  const span = document.querySelector("#bookFormSubmit span");
  if (span) {
    span.textContent = isComplete ? "Selesai dibaca" : "Belum selesai dibaca";
  }
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
    if (e.target === document.getElementById("editModal")) {
      handleCloseEdit();
    }
  });

  // Edit modal — close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") handleCloseEdit();
  });

  // Set initial submit button label
  updateSubmitButtonLabel();
});
