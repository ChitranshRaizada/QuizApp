# Quiz Blast 🚀

Quiz Blast is a high-octane, real-time multiplayer quiz application inspired by platforms like Kahoot and Quizizz. It features a polished "Immersive/Brutalist" design, Google Authentication, and real-time state synchronization via Firebase Firestore.

## ✨ Key Features

- **Real-Time Host Control**: Admins can import questions, start rounds, reveal answers, and advance to the next question in real-time.
- **Dynamic Leaderboards**: Live standings are visible to players, showing the top participants in the current session.
- **Interactive Player Experience**: Players receive instant feedback on their performance, including speed bonuses for quick correct answers.
- **Session Management**: Each quiz round is synchronized across all connected clients.
- **Modern Tech Stack**: Built with React 18, Vite, Tailwind CSS, and Firebase Firestore.

## 🛠️ Technology Stack

- **Frontend**: React (Functional Components, Hooks) also python
- **Styling**: Tailwind CSS (Utility-first styling with custom immersive theme)
- **Animations**: Framer Motion (Smooth transitions and UI feedback) and specialization
- **Backend/Database**: Firebase Firestore (Real-time data synchronization)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js installed
- A Firebase project configured (Enterprise/Standard)

### Installation

1. Clone or download the project files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Firebase configuration in `firebase-applet-config.json`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

- **`src/hooks/useQuiz.ts`**: The core business logic hook that manages Firestore listeners and operations for both admin and player roles.
- **`src/lib/firebase.ts`**: Firebase initialization and custom error handling logic.
- **`src/components/AdminPanel.tsx`**: The host control center for managing quiz state.
- **`src/components/PlayerView.tsx`**: The participant interface for answering questions and viewing results.
- **`firestore.rules`**: Hardened security rules ensuring data integrity and authorized access.

## 🔒 Security

The application implements strict Firestore Security Rules, ensuring:
- Only authenticated users can join sessions.
- Only the session creator (admin) can update quiz state.
- Players can only create/update their own participation records.
- Admins can update player scores during the "reveal" phase to maintain scoring authority.
- Admin Password for test run is 1234

## 🎨 Design Philosophy

The app follows an **Immersive Technical** aesthetic:
- High contrast, dark-themed UI.
- Bold, capitalized typography (Inter font).
- Purposeful micro-animations to guide user attention.
- Clean, data-driven visualizations for results.
