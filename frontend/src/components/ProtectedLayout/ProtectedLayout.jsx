import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Navbar from '../Navbar/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import AuroraBackground from '../Neon/AuroraBackground';
import Footer from '../Footer/Footer';
import './ProtectedLayout.css'


const ProtectedLayout = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // Check if we are exactly on the dashboard page
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="layout">
            <AuroraBackground />
            <Navbar />
            <div className="layout__body">
                <Sidebar />
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
