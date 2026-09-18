# ClassNotes — Software Design & Modeling Project

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-Tailwind-38B2AC?logo=tailwindcss&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)

**ClassNotes** is a student resource and knowledge-sharing platform built as the deliverable for a Software Design and Modeling course project. The repository contains two things:

1. The **design documentation** produced during the modeling phase — user stories, functional requirements, use case descriptions, and a traceability matrix connecting them.
2. A **working front-end prototype** that implements the core flows described in that documentation, so the design can be demonstrated interactively.

> 🔗 Repository: [SoftwareDesignandModeling-project-](https://github.com/LeonardoBejar145/SoftwareDesignandModeling-project-)

---

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Design & Modeling Documentation](#design--modeling-documentation)
- [Use Case Traceability Matrix](#use-case-traceability-matrix)
- [Prototype Features](#prototype-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Known Limitations & Notes](#known-limitations--notes)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Overview

ClassNotes lets students post class notes (with optional images/file attachments), browse a shared feed, and rate each other's posts, while professors get moderation powers such as banning/unbanning users and reviewing ban appeals. The project follows a standard requirements-engineering flow:

**User Stories → Functional Requirements → Use Cases → Traceability Matrix → Implementation**

The prototype is intentionally lightweight: it's a client-only web app with no server or real database, meant to demonstrate the modeled behavior rather than serve as a production system.

## Repository Structure

```
SoftwareDesignandModeling-project-/
├── README.md
├── complet-user-stories-and-functional-requirements   # User stories (US-*) and functional requirements (FR-*)
├── complete-use-cases-description                     # Detailed use case descriptions (UC-*)
├── use case traceability matrix.png                    # UC ↔ FR ↔ User Story mapping (image)
└── projectwebsite/                                     # Front-end prototype
    ├── index.html          # Main feed / library page
    ├── login.html          # Sign-in page + ban-appeal form
    ├── app.js              # Core application logic (feed, ratings, moderation)
    └── Library/
        ├── storage.js      # localStorage persistence wrapper (CNStorage)
        ├── utils.js        # Shared helpers (CNUtils): escaping, IDs, dates, file reading
        └── ratings.js      # Star-rating engine (CNRatings)
```

## Design & Modeling Documentation

| File | Contents |
|---|---|
| [`complet-user-stories-and-functional-requirements`](./complet-user-stories-and-functional-requirements) | 11 user stories (`US-S-*` student, `US-A-*` admin/professor, `US-U-*` universal) each mapped to a functional requirement (`FR-01`–`FR-11`) with acceptance criteria. |
| [`complete-use-cases-description`](./complete-use-cases-description) | Full use case specs (`UC-01`–`UC-11`): actors, preconditions, triggers, main/alternative flows, postconditions, and the source requirement for each. |
| [`use case traceability matrix.png`](./use%20case%20traceability%20matrix.png) | Single-page matrix tracing every use case back to its functional requirement and originating user story. |

## Use Case Traceability Matrix

![Use Case Traceability Matrix](./use%20case%20traceability%20matrix.png)

| Use Case | Name | Functional Req. | User Story |
|---|---|---|---|
| UC-01 | User Authentication | FR-11 | US-U-01 |
| UC-02 | Upload Post | FR-01 | US-S-01 |
| UC-03 | Search by Tag | FR-02 | US-S-02 |
| UC-04 | Download Post | FR-03 | US-S-03 |
| UC-05 | Rate Post | FR-04 | US-S-04 |
| UC-06 | Access Library | FR-05 | US-S-05 |
| UC-07 | Create Tag | FR-06 | US-A-01 |
| UC-08 | Review Post | FR-07 | US-A-02 |
| UC-09 | Ban User | FR-08 | US-A-03 |
| UC-10 | Unban User | FR-09 | US-A-04 |
| UC-11 | Approve New Account | FR-10 | US-A-05 |

## Prototype Features

**Implemented in `projectwebsite/`:**

- ✅ Role-based sign-in (Student 👨‍🎓 / Professor 👨‍🏫) — covers UC-01/FR-11 in simplified form (username only, no password check)
- ✅ Create a post with a title, text content, an optional image, and an optional document attachment (UC-02/FR-01)
- ✅ Feed of all posts, sortable by **Newest**, **Highest rated**, or **Lowest rated** (UC-06/FR-05)
- ✅ 5-star rating per post, one rating per user, click the same star again to remove it; authors can't rate their own posts (UC-05/FR-04)
- ✅ Download a post's attached file (UC-04/FR-03)
- ✅ Delete a post (author or any Professor) (partially covers UC-08/FR-07)
- ✅ Professor moderation panel: ban a user, view/resolve ban appeals, unban a user (UC-09/UC-10, FR-08/FR-09)
- ✅ Ban-appeal flow: a banned user is shown an appeal form on the login page instead of being let in

**Modeled but not yet built** (present in the requirements/use-case docs, not in the current code):

- ⏳ Tag creation and search-by-tag (UC-03/UC-07, FR-02/FR-06)
- ⏳ Admin review queue for newly uploaded posts before they go public (UC-08/FR-07 currently only covers deletion, not a pending-review workflow)
- ⏳ New-account approval workflow — any username can currently sign in (UC-11/FR-10)

## Tech Stack

- **HTML5** for structure
- **Tailwind CSS** (via CDN) for styling
- **Vanilla JavaScript (ES6+)** for all application logic — no framework, no build step
- **Browser `localStorage`** as the persistence layer (no backend server or database)

## Getting Started

No installation or build step is required — it's static HTML/JS.

1. **Clone the repository**
   ```bash
   git clone https://github.com/LeonardoBejar145/SoftwareDesignandModeling-project-.git
   cd SoftwareDesignandModeling-project-/projectwebsite
   ```

2. **Serve it locally.** Some browsers restrict file APIs (like reading uploaded images/documents) when a page is opened directly from disk (`file://`), so a local server is recommended:
   ```bash
   python3 -m http.server 8000
   # or: npx serve .
   ```

3. **Open it in your browser:**
   ```
   http://localhost:8000/login.html
   ```

## Usage Guide

1. On the sign-in page, pick a role (**Student** or **Professor**) and enter any username, then **Sign In**.
2. From the feed, fill out the form at the top to post a note — title, content, and optionally an image and/or a document.
3. Use the **Sort by** dropdown to switch between newest, highest-rated, and lowest-rated posts.
4. Click a star to rate someone else's post (click it again to undo your rating).
5. If signed in as a **Professor**, you'll also see:
   - A **🚫 Ban User** link on other users' posts.
   - A **🛡️ Appeals & Banned** button in the nav bar that opens the moderation panel, where you can review ban appeals and unban users.
6. If a banned user tries to sign in, they're shown an appeal form instead of the feed.

## Known Limitations & Notes

- **No backend/database:** all data (posts, ratings, banned users, appeals) lives in the browser's `localStorage`. It's per-browser/per-device and isn't shared between users — this is a client-side demo, not a multi-user production app.
- **No real authentication:** logging in only requires typing a username and choosing a role; there's no password check.
- **Folder casing:** `index.html`/`login.html` load scripts from `library/...` (lowercase), while the actual folder is `Library/` (capital L). This works on case-insensitive file systems (Windows/macOS) but will 404 on case-sensitive hosts (e.g., Linux servers, GitHub Pages). Worth aligning the casing before deploying.
- Data entered in one browser won't appear in another — there's no shared/central store.

## Roadmap

- [ ] Implement tag creation and tag-based search (UC-03, UC-07)
- [ ] Add a "pending review" state for new posts with an admin approve/deny queue (UC-08)
- [ ] Add a registration/approval flow for new accounts (UC-11)
- [ ] Replace `localStorage` with a real backend and database for multi-user persistence
- [ ] Add real authentication (passwords/sessions)

## Author

Developed by [**LeonardoBejar145**](https://github.com/LeonardoBejar145) as a Software Design and Modeling course project.
