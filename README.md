<div align="center">
  <img src="./Screenshot%202026-03-04%20235551.png" alt="MedAi Dashboard" width="800">
</div>

# MedAi

**MedAI** is a web-based AI Health Information Assistant designed to simplify access to trustworthy medical information. The platform helps users explore medicines, understand possible conditions based on symptoms, and maintain a personal health interaction history — all within a secure, conversational interface.

> **Disclaimer**: *MEDAI IS NOT A DIAGNOSTIC TOOL. IT PROVIDES INFORMATIONAL GUIDANCE ONLY AND ENCOURAGES USERS TO CONSULT LICENSED MEDICAL PROFESSIONALS.*

---

## 🚀 Key Features

*   **AI Symptom Checker**: Describe how you are feeling, and our AI will provide structured insights securely and identify possible conditions.
*   **Medicine Database**: Search our extensive database powered by OpenFDA for dosages, side effects, and interactions for specific medications (e.g., Amoxicillin, Acetaminophen).
*   **Symptom History & Recent Searches**: Review past symptom checks, AI structured guidance, and your recent medication searches for easy reference.
*   **Personalized Dashboard**: A dedicated dashboard providing a daily health overview and quick access to all essential tools.
*   **Secure Authentication**: Integrated Google Sign-In and robust session management using Firebase Authentication.

---

## 💻 Tech Stack

The application is split into a modern React frontend and an Express backend, powered by AI capabilities.

### Frontend
- **React 18** (with TypeScript)
- **Vite**
- **React Router v7** for navigation
- **Firebase** (Client-side auth)
- **Lucide React** for modern iconography
- Custom **CSS** styling for a clean, modern aesthetic

### Backend
- **Node.js & Express.js**
- **MongoDB** (via Mongoose)
- **OpenAI API** for processing symptom checks and providing conversational AI insights
- **OpenFDA API** for comprehensive medicine and drug information
- **Firebase Admin SDK** for secure authentication validation
- **JSON Web Tokens (JWT)** for session integrity
- **Axios** and **Cors**

---

## 🏁 Getting Started

### Prerequisites
Before you begin, ensure you have the following established:
- [Node.js](https://nodejs.org/) installed
- A running instance of MongoDB
- A configured [Firebase project](https://firebase.google.com/) for authentication
- An [OpenAI API Key](https://platform.openai.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd MedAi
   ```

2. **Setup Backend Environment**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   # Also ensure your Firebase Admin JSON credentials or config is accessible
   ```
   Start the backend development server:
   ```bash
   npm run dev
   ```

3. **Setup Frontend Environment**:
   Open a new terminal session and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   # Backend API URL (Defaulted to http://localhost:5000)
   VITE_API_URL=http://localhost:5000
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
