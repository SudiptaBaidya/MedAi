import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, Pill, MessageSquare, Menu, X, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './MainLayout.css' // Import pure CSS

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const location = useLocation()
    const { user, logout } = useAuth()

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: Activity },
        { name: 'Medicines', path: '/medicines', icon: Pill },
        { name: 'Symptom Checker', path: '/chat', icon: MessageSquare },
    ]

    return (
        <div className="main-layout">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="brand-link">
                        <span className="brand-dot"></span>
                        <span>Med<span className="brand-accent">AI</span></span>
                    </Link>
                    <button
                        className="mobile-menu-close"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="menu-label">
                    Main Menu
                </div>

                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <link.icon size={16} />
                            {link.name}
                        </Link>
                    )
                })}

                <div className="sidebar-bottom">
                    <div className="sidebar-divider"></div>

                    {/* User Profile Section */}
                    {user && (
                        <div className="profile-section">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="profile-avatar" />
                            ) : (
                                <div className="profile-avatar-fallback">
                                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                            )}
                            <div className="profile-info">
                                <p className="profile-name">{user.name || 'User'}</p>
                                <p className="profile-email">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <Link to="/settings" className={`settings-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                        <Settings size={16} />
                        Settings
                    </Link>
                    <button
                        onClick={logout}
                        className="signout-btn"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <Link to="/" className="mobile-brand">
                        <span className="brand-dot"></span>
                        <span>Med<span className="brand-accent">AI</span></span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                </header>

                <div className="content-scroll">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
