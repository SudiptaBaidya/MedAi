import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Moon, Sun, Bell, Shield, Key, LogOut } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    return (
        <div className="settings-container fade-in">
            <header className="settings-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account settings and preferences</p>
                </div>
            </header>

            <div className="settings-content">
                <div className="settings-grid">
                    {/* Profile Section */}
                    <section className="settings-card">
                        <div className="card-header">
                            <User className="card-icon" />
                            <h2>Profile Information</h2>
                        </div>
                        <div className="card-body">
                            <div className="profile-display">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="large-avatar" />
                                ) : (
                                    <div className="large-avatar-fallback">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={32} />}
                                    </div>
                                )}
                                <div className="profile-details">
                                    <h3>{user?.name || 'MedAI User'}</h3>
                                    <p>{user?.email || 'No email associated'}</p>
                                    <span className="badge badge-teal">Primary Account</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Preferences Section */}
                    <section className="settings-card">
                        <div className="card-header">
                            <Sun className="card-icon" />
                            <h2>Appearance</h2>
                        </div>
                        <div className="card-body">
                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Dark Mode</h4>
                                    <p>Toggle dark or light theme (demo)</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={darkMode}
                                        onChange={() => setDarkMode(!darkMode)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Notifications Section */}
                    <section className="settings-card">
                        <div className="card-header">
                            <Bell className="card-icon" />
                            <h2>Notifications</h2>
                        </div>
                        <div className="card-body">
                            <div className="setting-row border-bottom">
                                <div className="setting-info">
                                    <h4>Email Notifications</h4>
                                    <p>Receive weekly health tips and updates</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={emailNotif}
                                        onChange={() => setEmailNotif(!emailNotif)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Push Notifications</h4>
                                    <p>Get instant alerts for medicine reminders</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={pushNotif}
                                        onChange={() => setPushNotif(!pushNotif)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="settings-card">
                        <div className="card-header">
                            <Shield className="card-icon" />
                            <h2>Security</h2>
                        </div>
                        <div className="card-body">
                            <button className="btn btn-secondary">
                                <Key size={16} />
                                Change Password
                            </button>
                            <p className="security-note">If you signed in with Google, your password is managed by Google.</p>
                        </div>
                    </section>
                </div>

                <div className="settings-footer">
                    <button onClick={logout} className="btn btn-danger btn-lg">
                        <LogOut size={16} />
                        Sign Out of MedAI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
