import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TransactionProvider } from './context/TransactionContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <CurrencyProvider>
          <AuthProvider>
            <TransactionProvider>
              <App />
            </TransactionProvider>
          </AuthProvider>
        </CurrencyProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
