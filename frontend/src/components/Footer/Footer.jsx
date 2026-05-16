import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="glass-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="logo-orb"></div>
            <span>ExpenseTracker Pro</span>
          </div>
          <p className="footer-tagline">
            Empowering your financial journey. Track expenses, analyze spending, and secure your financial future.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="/dashboard">Dashboard</a>
            <a href="/transactions">Transactions</a>
            <a href="/reports">Reports</a>
            <a href="/profile">Profile</a>
          </div>

          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security</a>
          </div>

          <div className="footer-column">
            <h4>Connect</h4>
            <div className="footer-socials">
              <a 
                href="https://github.com/Ganesh40292" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a 
                href="https://www.linkedin.com/in/ganeshprasad40292" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a 
                href="mailto:expensetracker40292@gmail.com" 
                className="social-icon"
                aria-label="Email"
              >
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {currentYear} Developed by <strong>Ganesh Prasad</strong>. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
