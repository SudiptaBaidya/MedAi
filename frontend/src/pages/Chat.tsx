import { useState, useEffect } from 'react'
import { Send, User, Bot, AlertTriangle, Loader2, MessageSquarePlus, MessageSquare } from 'lucide-react'

// Define the expected structure from the backend AI
interface ParsedAIResponse {
    condition: string;
    reason: string;
    riskLevel: 'Low' | 'Moderate' | 'High';
    medicines?: string;
    nextStep: string;
}

interface Message {
    role: 'system' | 'user';
    content: string | ParsedAIResponse | any[];
}

interface Session {
    _id: string;
    title: string;
    updatedAt: string;
}

export default function Chat() {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com';
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: 'Hi, I am MedAI. How can I help you today? Please describe your symptoms.' }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [sessions, setSessions] = useState<Session[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/chat/sessions`)
            if (res.ok) {
                const data = await res.json()
                setSessions(data)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const loadSession = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/api/chat/sessions/${id}`)
            if (res.ok) {
                const session = await res.json()
                setCurrentSessionId(session._id)
                // Filter out non-user/assistant valid messages and parse JSON
                const loadedMessages = (session.messages || []).map((m: any) => {
                    let c = m.content
                    if (m.role === 'assistant' && typeof c === 'string') {
                        try { c = JSON.parse(c) } catch (e) { }
                    }
                    return { role: m.role === 'user' ? 'user' : 'system', content: c }
                })
                setMessages([
                    { role: 'system', content: 'Hi, I am MedAI. How can I help you today? Please describe your symptoms.' },
                    ...loadedMessages
                ])
            }
        } catch (err) {
            console.error("Failed to load session", err)
        }
    }

    const startNewChat = () => {
        setCurrentSessionId(null)
        setMessages([
            { role: 'system', content: 'Hi, I am MedAI. How can I help you today? Please describe your symptoms.' }
        ])
    }



    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        // Add user message
        const userMessage = input.trim()

        const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/chat/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    sessionId: currentSessionId
                })
            })

            if (!response.ok) {
                try {
                    const errData = await response.json();
                    console.error("Backend Error Details:", errData);
                    throw new Error(errData.details || 'Failed to analyze symptoms');
                } catch (e) {
                    throw new Error('Failed to analyze symptoms');
                }
            }

            const data = await response.json()

            setMessages([...newMessages, { role: 'system', content: data.response }])

            // If new session was created, refresh sidebar and set ID
            if (data.sessionId && data.sessionId !== currentSessionId) {
                setCurrentSessionId(data.sessionId)
                fetchSessions()
            }
        } catch (error) {
            console.error(error)
            setMessages([...newMessages, {
                role: 'system',
                content: "I'm having trouble connecting to the medical AI server right now. Please try again."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    // Helper to render AI structured JSON nicely based on Design Doc
    const renderMessageContent = (msg: Message) => {
        if (msg.role === 'user') {
            if (Array.isArray(msg.content)) {
                const textPart = msg.content.find(p => p.type === 'text')?.text;
                const imgPart = msg.content.find(p => p.type === 'image_url')?.image_url?.url;
                return (
                    <div className="flex flex-col gap-2">
                        {imgPart && <img src={imgPart} alt="Uploaded Symptom" className="max-w-[200px] rounded-md border border-teal-light shadow-sm" />}
                        {textPart && <div>{textPart}</div>}
                    </div>
                );
            }
            return <div>{msg.content as string}</div>
        } else if (typeof msg.content === 'string') {
            return <div>{msg.content}</div>
        }

        const aiData = msg.content as ParsedAIResponse;
        const riskColor =
            aiData.riskLevel === 'Low' ? 'bg-teal/12 text-teal-dark border-teal/20' :
                aiData.riskLevel === 'Moderate' ? 'bg-warn/15 text-[#b5850b] border-warn/20' :
                    'bg-danger/12 text-[#c0432b] border-danger/20'

        return (
            <div className="flex flex-col gap-3 min-w-[280px]">
                <div className="flex justify-between items-start gap-4 border-b border-gray-100/50 pb-3">
                    <h4 className="font-display font-bold text-navy text-[15px]">{aiData.condition}</h4>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${riskColor}`}>
                        Risk: {aiData.riskLevel}
                    </span>
                </div>

                <div>
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.1em] mb-1">Reasoning</div>
                    <div className="text-text-body text-[13px]">{aiData.reason}</div>
                </div>

                {aiData.medicines && (
                    <div className="mt-2 text-text-body text-[13px]">
                        <div className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.1em] mb-1">Suggested Medicines</div>
                        <div className="text-text-body text-[13px]">{aiData.medicines}</div>
                    </div>
                )}

                <div className="mt-1 bg-navy/5 p-3 rounded-md border border-navy/10">
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.1em] mb-1">Suggested Next Step</div>
                    <div className="text-navy font-medium text-[13px]">{aiData.nextStep}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full bg-gray-100/50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-100 flex-col hidden md:flex shadow-sm z-10 shrink-0">
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-navy text-white px-4 py-2.5 rounded-lg text-[13px] font-medium hover:bg-slate transition-colors"
                    >
                        <MessageSquarePlus size={16} />
                        New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <h3 className="text-[10px] font-mono text-gray-400 uppercase tracking-widest px-3 mb-3 mt-2">Recent Chats</h3>
                    {sessions.map(session => (
                        <button
                            key={session._id}
                            onClick={() => loadSession(session._id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${currentSessionId === session._id ? 'bg-teal/10 text-teal-dark font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <MessageSquare size={14} className={currentSessionId === session._id ? 'text-teal' : 'text-gray-400'} />
                            <span className="text-[13px] truncate flex-1">{session.title}</span>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-[12px] text-gray-400 px-3 py-2 italic text-center mt-4">No history yet</div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-gray-100/50">
                {/* Header Area */}
                <div className="bg-white border-b border-gray-100 p-4 md:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="font-display text-lg font-bold text-navy">Symptom Checker</h1>
                        <p className="text-[12px] text-text-muted">Describe how you feel for structured insights</p>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">

                    {/* Initial Disclaimer */}
                    <div className="flex justify-center mb-4">
                        <div className="bg-warn/10 border border-warn/20 rounded-md p-3 flex items-start gap-3 max-w-2xl w-full mx-auto">
                            <AlertTriangle className="text-[#8A6100] shrink-0 mt-0.5" size={16} />
                            <p className="text-[11px] text-[#8A6100] leading-relaxed">
                                <strong>Disclaimer:</strong> This tool provides informational guidance only and does not replace professional medical advice, diagnosis, or treatment. If this is a medical emergency, call your local emergency services immediately.
                            </p>
                        </div>
                    </div>

                    <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 w-full pb-10">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse self-end max-w-[85%]' : 'max-w-[85%] md:max-w-[70%]'}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                        ? 'bg-slate-light text-white'
                                        : 'bg-gradient-to-br from-teal to-teal-dark text-white'
                                        }`}
                                >
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                                </div>

                                <div
                                    className={`px-4 py-3 rounded-[16px] text-[13px] leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-teal text-navy rounded-br-sm'
                                        : 'bg-white border border-gray-100 text-text-body rounded-bl-sm'
                                        }`}
                                >
                                    {renderMessageContent(msg)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-teal to-teal-dark text-white">
                                    <Bot size={16} />
                                </div>
                                <div className="px-5 py-3.5 bg-white border border-gray-100 rounded-[16px] rounded-bl-sm flex items-center gap-2">
                                    <Loader2 className="animate-spin text-teal" size={16} />
                                    <span className="text-[12px] text-gray-500 font-medium animate-pulse">Analyzing symptoms securely...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-100 p-4 md:p-6 w-full">
                    <form
                        onSubmit={handleSend}
                        className="max-w-3xl mx-auto flex flex-col gap-3 relative"
                    >
                        <div className="flex gap-3 relative w-full items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="Type your symptoms (e.g., 'I have had a dull headache for 2 days')..."
                                className="flex-1 bg-gray-50 border-none rounded-xl py-3.5 pl-5 pr-14 text-[13px] text-text-body focus:ring-2 focus:ring-teal/20 outline-none placeholder:text-gray-400 disabled:opacity-50 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-teal text-navy rounded-lg flex items-center justify-center hover:bg-teal-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} className="ml-1" />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-3">
                        <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">
                            AI-generated content. Verify important information.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
