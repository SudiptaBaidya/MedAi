import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, Pill, MessageSquare, Menu, X, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
        <div className="flex h-screen bg-white">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-navy/20 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <nav className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-navy text-white flex flex-col gap-2 p-6
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="font-display text-xl font-extrabold flex items-center gap-2.5">
                        <span className="w-2 h-2 bg-teal rounded-full inline-block"></span>
                        <span>Med<span className="text-teal">AI</span></span>
                    </Link>
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="font-mono text-[9px] font-medium tracking-[0.12em] text-gray-400 uppercase mt-4 mb-1.5">
                    Main Menu
                </div>

                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-all duration-200
                ${isActive
                                    ? 'bg-teal text-navy font-medium'
                                    : 'text-gray-200 hover:bg-slate hover:text-white'
                                }
              `}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <link.icon size={16} />
                            {link.name}
                        </Link>
                    )
                })}

                <div className="mt-auto">
                    <div className="h-[1px] bg-slate w-full mb-4"></div>

                    {/* User Profile Section */}
                    {user && (
                        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-md bg-slate/50">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-teal text-navy flex items-center justify-center font-bold">
                                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{user.name || 'User'}</p>
                                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] text-gray-400 hover:bg-slate hover:text-white transition-all duration-200">
                        <Settings size={16} />
                        Settings
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] text-danger hover:bg-danger/10 transition-all duration-200 mt-1"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-navy text-white">
                    <Link to="/" className="font-display text-lg font-extrabold flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal rounded-full inline-block"></span>
                        <span>Med<span className="text-teal">AI</span></span>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
