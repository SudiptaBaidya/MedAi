import { useState, useEffect } from 'react'
import { Send, User, Bot, AlertTriangle, Loader2, MessageSquarePlus, MessageSquare } from 'lucide-react'
import './Chat.css'

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {imgPart && <img src={imgPart} alt="Uploaded Symptom" style={{ maxWidth: '200px', borderRadius: '6px', border: '1px solid var(--color-teal-light)' }} />}
                        {textPart && <div>{textPart}</div>}
                    </div>
                );
            }
            return <div>{msg.content as string}</div>
        } else if (typeof msg.content === 'string') {
            return <div>{msg.content}</div>
        }

        const aiData = msg.content as ParsedAIResponse;
        const riskClass = aiData.riskLevel.toLowerCase();

        return (
            <div className="ai-response-container">
                <div className="ai-header">
                    <h4 className="ai-condition">{aiData.condition}</h4>
                    <span className={`ai-risk ${riskClass}`}>
                        Risk: {aiData.riskLevel}
                    </span>
                </div>

                <div>
                    <div className="ai-label">Reasoning</div>
                    <div className="ai-text">{aiData.reason}</div>
                </div>

                {aiData.medicines && (
                    <div className="ai-medicines">
                        <div className="ai-label">Suggested Medicines</div>
                        <div className="ai-text">{aiData.medicines}</div>
                    </div>
                )}

                <div className="ai-next-step">
                    <div className="ai-label">Suggested Next Step</div>
                    <div className="ai-next-step-text">{aiData.nextStep}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-app-container">
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <button
                        onClick={startNewChat}
                        className="new-chat-btn"
                    >
                        <MessageSquarePlus size={16} />
                        New Chat
                    </button>
                </div>
                <div className="chat-history-list">
                    <h3 className="history-label">Recent Chats</h3>
                    {sessions.map(session => (
                        <button
                            key={session._id}
                            onClick={() => loadSession(session._id)}
                            className={`history-item ${currentSessionId === session._id ? 'active' : ''}`}
                        >
                            <MessageSquare size={14} className="history-item-icon" />
                            <span className="history-item-text">{session.title}</span>
                        </button>
                    ))}
                    {sessions.length === 0 && (
                        <div className="history-empty">No history yet</div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Header Area */}
                <div className="chat-header">
                    <div>
                        <h1 className="chat-header-title">Symptom Checker</h1>
                        <p className="chat-header-subtitle">Describe how you feel for structured insights</p>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="chat-messages-container">

                    {/* Initial Disclaimer */}
                    <div className="disclaimer-box-wrapper">
                        <div className="disclaimer-box">
                            <AlertTriangle className="disclaimer-icon" size={16} />
                            <p className="disclaimer-text-content">
                                <strong>Disclaimer:</strong> This tool provides informational guidance only and does not replace professional medical advice, diagnosis, or treatment. If this is a medical emergency, call your local emergency services immediately.
                            </p>
                        </div>
                    </div>

                    <div className="messages-list">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message-wrapper ${msg.role === 'user' ? 'user' : 'bot'}`}
                            >
                                <div className={`message-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                                </div>

                                <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                    {renderMessageContent(msg)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message-wrapper bot">
                                <div className="message-avatar bot">
                                    <Bot size={16} />
                                </div>
                                <div className="loading-indicator">
                                    <Loader2 className="loading-spinner" size={16} />
                                    <span className="loading-text">Analyzing symptoms securely...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                    <form
                        onSubmit={handleSend}
                        className="chat-form"
                    >
                        <div className="chat-input-wrapper">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="Type your symptoms (e.g., 'I have had a dull headache for 2 days')..."
                                className="chat-input"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="chat-send-btn"
                            >
                                <Send size={16} className="chat-icon-align" />
                            </button>
                        </div>
                    </form>
                    <div className="chat-footer">
                        <span className="chat-footer-text">
                            AI-generated content. Verify important information.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
