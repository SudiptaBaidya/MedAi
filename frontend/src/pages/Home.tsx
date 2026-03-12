import { useState, useEffect } from 'react'
import { Pill, Activity, ShieldAlert, FileText, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

export default function Home() {
    const { user } = useAuth()
    const [greeting, setGreeting] = useState('Good day')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 18) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    const firstName = user?.name ? user.name.split(' ')[0] : 'there'

    return (
        <div className="home-container">
            <div className="home-header">
                <div>
                    <h1 className="greeting-title">
                        {greeting}, {firstName}.
                    </h1>
                    <p className="greeting-subtitle">
                        Here's your daily health overview.
                    </p>
                </div>
            </div>

            <div className="hero-banner hero-box">
                <div className="hero-content">
                    <h2 className="hero-title">
                        Have questions about a new symptom?
                    </h2>
                    <p className="hero-description">
                        Describe how you are feeling, and our AI will provide structured insights securely.
                    </p>
                </div>
                <Link
                    to="/chat"
                    className="btn-hero"
                >
                    Check Symptoms <ArrowRight size={16} />
                </Link>
            </div>

            <div className="dashboard-grid">
                <div className="card feature-card">
                    <div className="feature-icon-wrapper icon-teal">
                        <Activity size={20} />
                    </div>
                    <h3 className="feature-title">Recent Searches</h3>
                    <p className="feature-description">You recently looked up interactions for Amoxicillin.</p>
                    <Link to="/medicines" className="feature-link link-teal link-hover">
                        View history <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon-wrapper icon-warn">
                        <Pill size={20} />
                    </div>
                    <h3 className="feature-title">Medicine Database</h3>
                    <p className="feature-description">Search our extensive database for dosages and side effects.</p>
                    <Link to="/medicines" className="feature-link link-warn link-hover">
                        Search medicines <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon-wrapper icon-sky">
                        <ShieldAlert size={20} />
                    </div>
                    <h3 className="feature-title">Symptom History</h3>
                    <p className="feature-description">Review past symptom checks and AI structured guidance.</p>
                    <Link to="/chat" className="feature-link link-sky link-hover">
                        View reports <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="card feature-card">
                    <div className="feature-icon-wrapper icon-purple">
                        <FileText size={20} />
                    </div>
                    <h3 className="feature-title">Report Analysis</h3>
                    <p className="feature-description">Upload your medical reports for instant, structured insights.</p>
                    <Link to="/reports" className="feature-link link-purple link-hover">
                        Analyze report <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <div className="disclaimer-section">
                <div className="disclaimer-text">
                    MedAI is not a diagnostic tool. It provides informational guidance only and encourages users to consult licensed medical professionals.
                </div>
            </div>
        </div>
    )
}
