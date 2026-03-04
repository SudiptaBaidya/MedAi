import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const theme = localStorage.getItem('theme');
if (theme === 'dark') {
  document.body.classList.add('dark-theme');
}

console.log("MedAI v1.1 - UI Enhanced");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
