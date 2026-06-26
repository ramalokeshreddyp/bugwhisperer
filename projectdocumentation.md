# 📄 Project Documentation — Bug Whisperer

This document provides a comprehensive operational, functional, and integration guide for the **Bug Whisperer** system.

---

## 🎯 1. Project Conception & Objectives

### The Problem
Beginner developers face a steep learning curve. When they encounter runtime stack traces or syntax errors, the feedback provided by compilers and runtimes is often designed for expert systems engineers. This causes frustration, anxiety, and a reliance on copy-pasting code into search engines without understanding the root cause.

### The Solution: Bug Whisperer
**Bug Whisperer** acts as a friendly, virtual coding tutor. It intercepts these raw, intimidating messages and uses a custom-tuned generative AI prompt to break them down into structured, accessible components.

---

## 🏗️ 2. Core Functional Requirements & Features

### 2.1 Interface & User Experience
*   **Error Input Textarea**: A clean monospace text editor where developers paste their error traces.
*   **Optional Code Input Textarea**: An optional input area to supply the code snippet causing the error. Providing this snippet enables the AI to give highly contextualized before/after code comparisons.
*   **Interactive Examples**: Clickable, preloaded buttons representing common beginner bugs (ReferenceError, TypeError, SyntaxError, IndentationError). These buttons demonstrate the tool's capabilities instantly.
*   **Structured Results Display**:
    *   **Category Badge**: Visual color coding and emojis classifying the bug type (Syntax, Runtime, Logic, or Unknown).
    *   **What Happened Card**: Highlights what the error actually means.
    *   **Why It Happened Card**: Simplifies the core programming concept using real-world analogies.
    *   **Where to Look Card**: Points the user to the exact lines or files to search.
    *   **How to Fix It Card**: Offers a clear numbered checklist to resolve the issue.
    *   **Code Diff Box**: Shows the side-by-side comparison of the bad code vs the fixed code.
    *   **Copy Code Utility**: A one-click copy button to grab the corrected code snippet.
    *   **Encouragement Banner**: Provides positive reinforcement to support learning.

---

## 🛠️ 3. Tech Stack & Architectural Decisions

| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **React 19** | UI Library | Allows components to render client-side UI states (loading skeletons, diff boxes) fluidly. |
| **TanStack Start** | Full-Stack Framework | Combines React SSR, TanStack Router, and server functions. This enables server-side functions to be called directly from the client via type-safe RPCs. |
| **Tailwind CSS v4** | CSS Engine | Offers utility-first CSS compiling, a sleek dark/light palette, custom glassmorphism layers, and responsive typography out-of-the-box. |
| **Zod** | Validation | Ensures incoming API requests contain valid strings, preventing server crashes from malformed inputs. |
| **Gemini API** / **OpenAI API** | Intelligence Layer | Leverages Gemini 2.5 Flash and GPT-4o mini for fast, cost-effective, and highly structured explanations. |

---

## ⚡ 4. Code Implementation & API Integration

### 4.1 Input Validation (Zod Schema)
To prevent server injection and ensure API stability, inputs are strictly parsed using a Zod schema within the server handler:

```typescript
z.object({
  errorMessage: z.string().min(1).max(5000),
  codeSnippet: z.string().max(5000).optional(),
})
```

### 4.2 Error Handling & Resilience
*   **AI Gateway Timeouts & Failures**: The server function intercepts HTTP non-200 responses. It checks for specific codes like `429` (Rate limit exceeded) and `401/402` (Authentication/Billing limits) and throws friendly, readable error notifications back to the frontend.
*   **Router Level Errors**: `src/router.tsx` defines a global HTML error boundary wrapper. If a component render crash occurs, it displays a standard message with a button to reload the route cache.

---

## 🧪 5. Testing & Verification Strategy

### 5.1 Automated Builds
The codebase is validated by running the compiler pipeline to ensure zero type check warnings, zero bundler errors, and clean asset builds:
```bash
npm run build
```

### 5.2 Manual Verification Checklist

| Step | Action | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **1** | Click on example: `ReferenceError: x is not defined` | Inputs are populated; result resets. | Pass |
| **2** | Click "✨ Explain This!" without API keys set | Red toast displays warning about missing API configuration. | Pass |
| **3** | Set `GEMINI_API_KEY` and re-run example | UI displays loading skeleton, then resolves all result cards. | Pass |
| **4** | Click **"Copy fixed code"** | Toast says "Copied!", and system clipboard contains the corrected code block. | Pass |
| **5** | Resize browser window to mobile view (360px) | Layout scales down fluidly, text is readable, inputs fit on screen. | Pass |
