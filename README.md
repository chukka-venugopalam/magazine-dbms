#  Magazine Management System

A DBMS-based web application to manage articles, authors, categories, and publishing workflow for a magazine/newspaper agency.

---

##  Features

- Add and manage authors  
- Create and manage articles  
- Assign categories to articles (many-to-many relationship)  
- Create magazine issues  
- Publish articles to issues  
- View articles with author details (JOIN queries)  
- Filter articles by status and author  

---

##  DBMS Concepts Used

- Primary Keys and Foreign Keys  
- One-to-Many Relationship (Author → Articles)  
- Many-to-Many Relationship (Articles ↔ Categories)  
- JOIN Queries (Articles + Authors)  
- Normalization (3NF design)  
- Constraints (UNIQUE, NOT NULL)  

---

##  Tech Stack

- Frontend: HTML, CSS, JavaScript  
- Backend/Database: Supabase (PostgreSQL)  

---
# Link Demo 
https://chukka-venugopalam.github.io/magazine-dbms/

---
##  Project Structure
index.html   → UI structure
style.css    → Styling
app.js       → Logic + Supabase integration

---

##  Setup Instructions

1. Create a project in Supabase  
2. Run SQL schema to create tables  
3. Enable Row Level Security (RLS)  
4. Add "Allow all" policies for all tables  
5. Copy:
   - Project URL  
   - Anonymous API Key  
6. Paste them in `app.js`:

```javascript
const supabaseUrl = "YOUR_URL";
const supabaseKey = "YOUR_ANON_KEY";
```

Open index.html in browser
## Database Tables

- authors
- articles
- categories
- article_category
- issues
- published_articles

##  Purpose
This project demonstrates practical implementation of DBMS concepts using a real-world scenario with a working frontend and cloud database.

## Author
Venugopalam Chukka
