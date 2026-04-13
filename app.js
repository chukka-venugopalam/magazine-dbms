// ====================================================
//  MAGAZINE MANAGEMENT SYSTEM — app.js
//  Backend: Supabase | Language: Vanilla JS
//  Replace the two placeholders below with your keys
// ====================================================

// ---- SUPABASE CONFIG ----
const supabaseUrl = "https://mqetatwdhftyiyufctus.supabase.co";       // e.g. https://abcd.supabase.co
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZXRhdHdkaGZ0eWl5dWZjdHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzkyNDYsImV4cCI6MjA5MTY1NTI0Nn0.68j0sbgy9iWFJC-DkxkSKY6F1J_tMxVr-59m_UO6e9Y";  // from Settings > API

// Initialize Supabase client using the CDN global
const { createClient } = supabase;
const db = createClient(supabaseUrl, supabaseKey);

// ====================================================
//  UTILITY: Toast notification
//  Shows a small success/error popup at the bottom
// ====================================================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;       // applies .success or .error
  toast.classList.remove("hidden");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// ====================================================
//  UTILITY: Build an HTML table from an array of objects
//  columns = [{ key, label }]
//  rows    = array of data objects
// ====================================================
function buildTable(containerId, columns, rows) {
  const container = document.getElementById(containerId);

  if (!rows || rows.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span>📭</span>
        No records found.
      </div>`;
    return;
  }

  // Build header row from column labels
  const ths = columns.map(c => `<th>${c.label}</th>`).join("");

  // Build each data row
  const trs = rows.map(row => {
    const tds = columns.map(c => {
      let val = row[c.key] ?? "—";

      // Special rendering: status badges
      if (c.key === "status") {
        val = `<span class="badge badge-${val}">${val}</span>`;
      }
      return `<td>${val}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  container.innerHTML = `
    <table>
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>`;
}

// ====================================================
//  SECTION 1: AUTHORS
// ====================================================

// ---- INSERT: Add a new author ----
async function addAuthor() {
  const name  = document.getElementById("author-name").value.trim();
  const email = document.getElementById("author-email").value.trim();
  const role  = document.getElementById("author-role").value;

  // Basic validation
  if (!name || !email) {
    showToast("Please fill in Name and Email.", "error");
    return;
  }

  // INSERT into authors table
  const { error } = await db
    .from("authors")
    .insert([{ name, email, role }]);

  if (error) {
    console.error("addAuthor error:", error);
    showToast("Error: " + error.message, "error");
    return;
  }

  showToast("✅ Author added successfully!");

  // Clear form fields
  document.getElementById("author-name").value  = "";
  document.getElementById("author-email").value = "";
}

// ---- SELECT: Load all authors into a table ----
async function loadAuthors() {
  const { data, error } = await db
    .from("authors")
    .select("author_id, name, email, role")
    .order("author_id");

  if (error) {
    console.error("loadAuthors error:", error);
    showToast("Could not load authors.", "error");
    return;
  }

  buildTable("authors-table", [
    { key: "author_id", label: "ID"    },
    { key: "name",      label: "Name"  },
    { key: "email",     label: "Email" },
    { key: "role",      label: "Role"  },
  ], data);
}

// ---- HELPER: Populate <select> dropdowns with authors ----
async function populateAuthorDropdown() {
  const { data, error } = await db
    .from("authors")
    .select("author_id, name");

  if (error) {
    console.error("populateAuthorDropdown error:", error);
    return;
  }

  const sel = document.getElementById("article-author");
  sel.innerHTML = `<option value="">-- Select Author --</option>`;
  data.forEach(a => {
    sel.innerHTML += `<option value="${a.author_id}">${a.name} (ID: ${a.author_id})</option>`;
  });
}

// ====================================================
//  SECTION 2: ARTICLES
// ====================================================

// ---- INSERT: Add a new article ----
async function addArticle() {
  const title     = document.getElementById("article-title").value.trim();
  const content   = document.getElementById("article-content").value.trim();
  const status    = document.getElementById("article-status").value;
  const author_id = document.getElementById("article-author").value;

  if (!title || !content || !author_id) {
    showToast("Title, Content, and Author are required.", "error");
    return;
  }

  // INSERT into articles table
  // created_at has a default value in Supabase (now()), so we don't send it
  const { error } = await db
    .from("articles")
    .insert([{ title, content, status, author_id: parseInt(author_id) }]);

  if (error) {
    console.error("addArticle error:", error);
    showToast("Error: " + error.message, "error");
    return;
  }

  showToast("✅ Article added successfully!");

  // Clear fields
  document.getElementById("article-title").value   = "";
  document.getElementById("article-content").value = "";
}

// ---- SELECT: Load articles with author names via JOIN ----
// Supabase supports relational queries with dot notation:
//   authors(name) tells Supabase to JOIN authors and pull the name field
async function loadArticles() {
  const statusFilter = document.getElementById("filter-status").value;
  const authorFilter = document.getElementById("filter-author").value.trim();

  // Start building the query
  // The "authors(name)" syntax performs an implicit JOIN on the FK
  let query = db
    .from("articles")
    .select("article_id, title, status, created_at, authors(name)")
    .order("created_at", { ascending: false });

  // Apply filters only if the user selected something
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (authorFilter) {
    query = query.eq("author_id", parseInt(authorFilter));
  }

  const { data, error } = await query;

  if (error) {
    console.error("loadArticles error:", error);
    showToast("Could not load articles.", "error");
    return;
  }

  // Flatten the nested authors object for table display
  // Supabase returns: { ..., authors: { name: "Venu" } }
  const flat = data.map(row => ({
    article_id:  row.article_id,
    title:       row.title,
    status:      row.status,
    author_name: row.authors?.name ?? "Unknown",
    created_at:  row.created_at ? row.created_at.slice(0, 10) : "—",
  }));

  buildTable("articles-table", [
    { key: "article_id",  label: "ID"      },
    { key: "title",       label: "Title"   },
    { key: "author_name", label: "Author"  },
    { key: "status",      label: "Status"  },
    { key: "created_at",  label: "Date"    },
  ], flat);
}

// ---- HELPER: Clear filters and reload ----
function clearFilters() {
  document.getElementById("filter-status").value = "";
  document.getElementById("filter-author").value = "";
  loadArticles();
}

// ====================================================
//  SECTION 3: CATEGORIES
// ====================================================

// ---- INSERT: Add a new category ----
async function addCategory() {
  const name = document.getElementById("cat-name").value.trim();

  if (!name) {
    showToast("Category name is required.", "error");
    return;
  }

  const { error } = await db
    .from("categories")
    .insert([{ name }]);

  if (error) {
    console.error("addCategory error:", error);
    showToast("Error: " + error.message, "error");
    return;
  }

  showToast("✅ Category added!");
  document.getElementById("cat-name").value = "";
}

// ---- HELPER: Populate both dropdowns for Assign Category ----
async function populateCategoryDropdowns() {
  // Load articles
  const { data: articles, error: err1 } = await db
    .from("articles")
    .select("article_id, title");

  // Load categories
  const { data: cats, error: err2 } = await db
    .from("categories")
    .select("category_id, name");

  if (err1 || err2) {
    showToast("Could not load data.", "error");
    console.error(err1, err2);
    return;
  }

  // Fill Articles dropdown
  const artSel = document.getElementById("assign-article");
  artSel.innerHTML = `<option value="">-- Select Article --</option>`;
  articles.forEach(a => {
    artSel.innerHTML += `<option value="${a.article_id}">${a.title} (ID: ${a.article_id})</option>`;
  });

  // Fill Categories dropdown
  const catSel = document.getElementById("assign-category");
  catSel.innerHTML = `<option value="">-- Select Category --</option>`;
  cats.forEach(c => {
    catSel.innerHTML += `<option value="${c.category_id}">${c.name} (ID: ${c.category_id})</option>`;
  });

  showToast("Data loaded!", "success");
}

// ---- INSERT: Assign a category to an article (many-to-many via junction table) ----
async function assignCategory() {
  const article_id  = document.getElementById("assign-article").value;
  const category_id = document.getElementById("assign-category").value;

  if (!article_id || !category_id) {
    showToast("Please select both an article and a category.", "error");
    return;
  }

  // Insert into article_category junction table
  // This is the classic many-to-many DBMS concept
  const { error } = await db
    .from("article_category")
    .insert([{
      article_id:  parseInt(article_id),
      category_id: parseInt(category_id)
    }]);

  if (error) {
    console.error("assignCategory error:", error);
    // Handle duplicate assignment
    if (error.code === "23505") {
      showToast("This category is already assigned to the article.", "error");
    } else {
      showToast("Error: " + error.message, "error");
    }
    return;
  }

  showToast("✅ Category assigned to article!");
}

// ====================================================
//  SECTION 4: ISSUES & PUBLISH
// ====================================================

// ---- INSERT: Create a new issue ----
async function addIssue() {
  const title        = document.getElementById("issue-title").value.trim();
  const publish_date = document.getElementById("issue-date").value;

  if (!title || !publish_date) {
    showToast("Issue title and date are required.", "error");
    return;
  }

  const { error } = await db
    .from("issues")
    .insert([{ title, publish_date }]);

  if (error) {
    console.error("addIssue error:", error);
    showToast("Error: " + error.message, "error");
    return;
  }

  showToast("✅ Issue created!");
  document.getElementById("issue-title").value = "";
  document.getElementById("issue-date").value  = "";
}

// ---- HELPER: Populate dropdowns for Publish section ----
async function populatePublishDropdowns() {
  // Load issues
  const { data: issues, error: err1 } = await db
    .from("issues")
    .select("issue_id, title");

  // Load articles
  const { data: articles, error: err2 } = await db
    .from("articles")
    .select("article_id, title");

  if (err1 || err2) {
    showToast("Could not load data.", "error");
    console.error(err1, err2);
    return;
  }

  // Fill Issues dropdown
  const issueSel = document.getElementById("pub-issue");
  issueSel.innerHTML = `<option value="">-- Select Issue --</option>`;
  issues.forEach(i => {
    issueSel.innerHTML += `<option value="${i.issue_id}">${i.title} (ID: ${i.issue_id})</option>`;
  });

  // Fill Articles dropdown
  const artSel = document.getElementById("pub-article");
  artSel.innerHTML = `<option value="">-- Select Article --</option>`;
  articles.forEach(a => {
    artSel.innerHTML += `<option value="${a.article_id}">${a.title} (ID: ${a.article_id})</option>`;
  });

  showToast("Data loaded!", "success");
}

// ---- INSERT: Publish an article to an issue ----
// This inserts into published_articles junction table
async function publishArticle() {
  const issue_id   = document.getElementById("pub-issue").value;
  const article_id = document.getElementById("pub-article").value;
  const page_num   = document.getElementById("pub-page").value;

  if (!issue_id || !article_id || !page_num) {
    showToast("All fields are required to publish.", "error");
    return;
  }

  const { error } = await db
    .from("published_articles")
    .insert([{
      issue_id:    parseInt(issue_id),
      article_id:  parseInt(article_id),
      page_number: parseInt(page_num)
    }]);

  if (error) {
    console.error("publishArticle error:", error);
    if (error.code === "23505") {
      showToast("This article is already published in this issue.", "error");
    } else {
      showToast("Error: " + error.message, "error");
    }
    return;
  }

  showToast("✅ Article published to issue!");
  document.getElementById("pub-page").value = "";
}

// ====================================================
//  ON PAGE LOAD
//  Auto-load articles table when View tab is first opened
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
  // Pre-populate author dropdown on Articles tab
  // (loads silently in background)
  populateAuthorDropdown();

  // Auto-load the articles view when the View tab is clicked
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === "view") {
        loadArticles();
      }
    });
  });

  console.log("✅ Magazine Management System loaded.");
  console.log("👉 Make sure supabaseUrl and supabaseKey are set in app.js");
});
      
