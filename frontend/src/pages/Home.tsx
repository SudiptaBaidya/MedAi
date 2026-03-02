import { useState, useEffect } from 'react'
import { Pill, Activity, ShieldAlert, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-extrabold text-navy leading-tight">
                        {greeting}, {firstName}.
                    </h1>
                    <p className="text-[13px] text-text-muted mt-1">
                        Here's your daily health overview.
                    </p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-teal to-teal-dark rounded-lg p-5 md:p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-float">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-[15px] font-semibold text-white mb-1">
                        Have questions about a new symptom?
                    </h2>
                    <p className="text-[12px] text-mint/90 max-w-sm">
                        Describe how you are feeling, and our AI will provide structured insights securely.
                    </p>
                </div>
                <Link
                    to="/chat"
                    className="bg-white text-navy hover:bg-mint px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2"
                >
                    Check Symptoms <ArrowRight size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="card hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 rounded-md bg-teal/10 flex items-center justify-center text-teal-dark mb-4">
                        <Activity size={20} />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-navy mb-1">Recent Searches</h3>
                    <p className="text-[12px] text-text-muted mb-4">You recently looked up interactions for Amoxicillin.</p>
                    <Link to="/medicines" className="text-teal text-[12px] font-semibold hover:underline flex items-center gap-1">
                        View history <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="card hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 rounded-md bg-warn/15 flex items-center justify-center text-[#8A6100] mb-4">
                        <Pill size={20} />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-navy mb-1">Medicine Database</h3>
                    <p className="text-[12px] text-text-muted mb-4">Search our extensive database for dosages and side effects.</p>
                    <Link to="/medicines" className="text-[#8A6100] text-[12px] font-semibold hover:underline flex items-center gap-1">
                        Search medicines <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="card hover:shadow-lg transition-shadow">
                    <div className="w-10 h-10 rounded-md bg-sky/20 flex items-center justify-center text-[#2A7A8C] mb-4">
                        <ShieldAlert size={20} />
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-navy mb-1">Symptom History</h3>
                    <p className="text-[12px] text-text-muted mb-4">Review past symptom checks and AI structured guidance.</p>
                    <Link to="/chat" className="text-[#2A7A8C] text-[12px] font-semibold hover:underline flex items-center gap-1">
                        View reports <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-8">
                <div className="text-center font-mono text-[10px] text-gray-400 uppercase tracking-widest bg-gray-100 rounded-md p-3 max-w-2xl mx-auto">
                    MedAI is not a diagnostic tool. It provides informational guidance only and encourages users to consult licensed medical professionals.
                </div>
            </div>
        </div>
    )
}
