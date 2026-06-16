# designboard

An interactive, adaptive system design playground and mock-interview platform. Draw architectural diagrams on a custom SVG canvas, defend your design choices against an AI interviewer, and receive comprehensive feedback reports.

---

## Project Structure

The project is structured as a monorepo containing two main modules:

*   **[`/frontend`](file:///C:/Users/ujjwa/Desktop/internship/ujjwal-work/system-design/frontend)**: A client-side Next.js web application built with TypeScript, Tailwind CSS, and Framer Motion. It includes a custom SVG whiteboard canvas and detailed evaluation report views.
*   **[`/backend`](file:///C:/Users/ujjwa/Desktop/internship/ujjwal-work/system-design/backend)**: An Express.js backend API built with TypeScript and Mongoose (MongoDB). It coordinates authentication, stores interview sessions, and interfaces with Gemini (AI interviewer & evaluator) and AssemblyAI (Speech-to-Text).

---

## Key Features

1.  **Interactive SVG Whiteboard Canvas**:
    *   **Custom Preset Components**: Drag/click blocks for `Client`, `DNS`, `CDN`, `Load Balancer`, `API Gateway`, `Service`, `Cache`, `Queue`, `Database`, `Object Store`, `Search`, `Worker`, and generic `Custom` elements.
    *   **Interactive Node Editing**: Double-click any block inline to customize its label and metadata tags.
    *   **Intelligent Connectors**: Draw curved, multi-routing connection edges between nodes. Includes validation that requires entering a connection purpose/details, with optional protocol fields (e.g. HTTPS, gRPC, WebSocket).
2.  **Adaptive AI Interviewer**:
    *   The AI opens with questions tailored to your canvas diagram.
    *   Drills down into system bottlenecks, database replication, write scaling spikes, and failure scenarios.
3.  **Detailed Architecture Reports**:
    *   Interactive rating gauge displaying overall scores (1-10 scale).
    *   Performance trend line chart tracking candidate score progression per question.
    *   Cohesive breakdown listing overall strengths and improvements.
    *   Detailed, question-by-question scoring and feedback.
4.  **Practice Arena Dashboard**:
    *   Questions ordered logically by difficulty (Easy $\rightarrow$ Medium $\rightarrow$ Hard).
    *   Text-to-Speech (TTS) voice narrator with a global switch (defaults to **Voice Off**).

---

## Prerequisites

*   **Node.js**: Version `20.9.0` or newer.
*   **MongoDB**: A running instance (local or Atlas cluster).
*   **API Keys**:
    *   Google Gemini API Key (for interview simulation and report generation).
    *   AssemblyAI API Key (for speech processing).

---

## Getting Started

### 1. Set Up the Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables:
    Create a `.env` file based on `.env.example`:
    ```env
    PORT = 8080
    JWT_SECRET = "your-jwt-secret-key"
    MONGO_URI = mongodb://localhost:27017/designboard
    GEMINI_API = "your-gemini-api-key"
    ASSEMBLY_AI_API_KEY = "your-assembly-ai-api-key"
    FRONTEND_URL = http://localhost:3000
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will connect to MongoDB and start listening on port `8080`.

### 2. Set Up the Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables:
    Create a `.env` file:
    ```env
    NEXT_PUBLIC_API_URL = http://localhost:8080
    ```
4.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Keyboard Controls & Shortcuts

*   **Select Tool**: Press `1` or `V`
*   **Pan Tool**: Press `2` or `H`
*   **Edge Tool**: Press `3` or `E`
*   **Pan Canvas**: `Space + Drag` or click and drag using the Middle or Right mouse buttons.
*   **Multi-Select**: Click and drag a selection box around multiple nodes.
*   **Edit Node/Edge**: Double-click any element on the canvas to update its text.
*   **Delete Selected**: Press `Delete` or `Backspace`.
