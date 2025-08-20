# Interactive Quote Journal

A modern, full-stack web application for discovering, saving, and visualizing the emotional essence of quotes. This project showcases a complete, end-to-end system built with a professional tech stack, including a secure backend API and a persistent database.

---

### ✨ [View Live Demo](https://your-deployment-link-here.com) ✨

*(Link to be updated after deployment)*

---

## Key Features

*   **Dynamic Quote Discovery:** Fetches inspiring quotes from an external API.
*   **Persistent Personal Journal:** Save, view, and remove quotes from your personal journal, with all data stored in a MongoDB database.
*   **AI-Powered "Visualize the Vibe":** A signature feature that uses an AI model to analyze the mood of a quote and dynamically transforms the application's color theme to match.
*   **Interactive Author Biographies:** Click on an author's name to view their biography, fetched from the Wikipedia API.
*   **Modern, Responsive UI:** A clean, accessible, and fully responsive user interface built with Tailwind CSS.

## Technical Architecture

This application is architected as a professional, full-stack system:

1.  **Frontend:** A responsive and interactive UI built with **React** and **Next.js**.
2.  **Backend API:** A secure backend built with **Next.js API Routes**. This server-side layer handles all logic, data fetching, and communication with external services. **Crucially, it protects all API keys and sensitive credentials**, which are never exposed to the client.
3.  **Database:** A **MongoDB** database serves as the persistent storage layer for the user's quote journal. All journal entries are created, read, and deleted via the secure backend API.
4.  **AI Integration:** The "Visualize the Vibe" feature communicates with an AI model via the secure backend, ensuring the AI service's API key is never compromised.

## Tech Stack

*   **Framework:** Next.js (for both frontend and backend)
*   **Language:** TypeScript
*   **Database:** MongoDB
*   **Styling:** Tailwind CSS
*   **AI Integration:** AI model accessed via a secure API
*   **Testing:**
    *   **Unit/Integration:** Jest & React Testing Library
    *   **End-to-End:** Playwright
*   **Deployment:** Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone https://your-repo-url/interactive-quote-journal.git
cd interactive-quote-journal
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.