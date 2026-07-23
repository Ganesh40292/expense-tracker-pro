import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import AuroraBackground from '../Neon/AuroraBackground';
import Footer from '../Footer/Footer';
import CommandPalette from '../CommandPalette/CommandPalette';
import ExpenseBot from '../ExpenseBot/ExpenseBot';
import './ProtectedLayout.css'


const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Check if we are exactly on the dashboard page
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const handleToggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    const handleCloseSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="layout">
            <AuroraBackground />
            <Navbar onToggleSidebar={handleToggleSidebar} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
            <CommandPalette isOpen={commandPaletteOpen} onClose={setCommandPaletteOpen} />
            <ExpenseBot />
            <div className="layout__body">
                <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
                <main className="layout__content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                    <div style={{ flex: '1 0 auto' }}>
                        <Outlet />
                    </div>
                    {isDashboard && (
                        <div style={{ padding: '0 24px' }}>
                            <Footer />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProtectedLayout;
