# 💡 CodeGlow AI — Glowing Codebase Complexity Heatmap & Refactor Console

**CodeGlow AI** is an open-source visual codebase analyzer designed to scan directories recursively, evaluate files for technical debt, documentation coverage, and security, and render an interactive glowing heatmap grid of refactoring targets.

Built with **React, Vite, Express, and Vanilla CSS** utilizing glassmorphic dark-theme aesthetics, CodeGlow AI helps developers visually spot problematic spaghetti code and click files to open a real-time **Refactoring Console** that suggests optimized refactored alternatives.

---

## ✨ Features

*   📂 **Local Codebase Scanner**: Scans folders recursively on your machine. Automatically filters out `node_modules`, `.git`, lockfiles, and media files, and measures lines of code (LOC) and file sizes.
*   🟢 **Glowing Debt Heatmap Grid**: Renders scanned source files as glass cards. Card outlines glow with colors corresponding to their AI technical debt grades (Green = A, Blue = B, Yellow = C, Orange = D, Red = F, Gray = Unaudited).
*   📊 **Interactive Audit Reports**: Click any file to run static AI audits. CodeGlow AI scores the file on:
    *   **Code Readability** (Cyclomatic complexity check)
    *   **Security Vulnerability** (Auth, injections, and insecure pattern checks)
    *   **Comments Coverage** (Documentation and docstrings check)
*   🛠️ **Side-by-Side Refactoring Console**: View original code alongside optimized AI refactored code (fully commented) and detailed modification notes.
*   🧠 **17 Supported LLM Providers**: Unified backend client supporting Gemini, OpenAI, Claude, Groq, Mistral, Cohere, DeepSeek, and more.
*   🔒 **Secure & Confidential**: No cloud-based telemetry databases. All LLM keys and code logs are kept on your browser's private `localStorage` and hosted locally.

---

## 🏗️ Architecture

> [!NOTE]
> CodeGlow AI runs an Express backend on port `3005`. The backend parses folder structures programmatically using standard filesystem `fs` recursive modules, retrieves raw code blocks for rendering, and routes AI analysis payloads to bypass CORS blocks.

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   An API key from a supported provider (Gemini or OpenAI recommended)

### Installation & Launch

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start both servers concurrently**:
    ```bash
    npm run dev
    ```
    *This starts the Node controller backend on `http://localhost:3005` and the React admin dashboard on `http://localhost:5177`.*

3.  Open **[http://localhost:5177](http://localhost:5177)** in your browser.

---

## 💡 How to Use

### 1. Setup your API Key
*   Click **Configure LLM** in the top right corner.
*   Select your provider, model, and paste your API key. Click **Save Configuration**.

### 2. Connect a Local Codebase
*   Enter the absolute path of a source folder on your machine:
    *   e.g. `/home/kregg/agy/Ai Apps/gitpulse-ai/src`
*   Click **Scan Directory**. The app will calculate total LOC, file counts, and render the visual heatmap.

### 3. Audit & Refactor Files
*   Click any file card in the heatmap grid.
*   Click **Run AI Audit** to run complexity scoring and get a list of diagnosed issues.
*   Click **Suggest AI Refactor** to compile an optimized version of the file side-by-side with copy buttons!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
