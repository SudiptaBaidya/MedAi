import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Send, User, Bot, AlertTriangle, Loader2, MessageSquarePlus, MessageSquare, Mic, Info, ChevronRight, Stethoscope, Pill, ArrowRightCircle, Trash2, Search, Menu, X } from 'lucide-react'
import './Chat.css'
import { useAuth } from '../context/AuthContext'

// Define the expected structure from the backend AI
interface ParsedAIResponse {
    type?: 'chat' | 'diagnosis';
    message?: string; // For general chat
    condition?: string; // For diagnosis
    reason?: string;
    riskLevel?: 'Low' | 'Moderate' | 'High';
    medicines?: string;
    nextStep?: string;
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

const QUICK_SUGGESTIONS = [
    "Headache", "Fever", "Stomach Pain", "Chest Pain", "Cough", "Fatigue"
]

export default function Chat() {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com';
    const { user } = useAuth()
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        { role: 'system', content: 'Hi, I am MedAI. How can I help you today? Please describe your symptoms.' }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [autoSubmit, setAutoSubmit] = useState(false)
    const [sessions, setSessions] = useState<Session[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        fetchSessions()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    useEffect(() => {
        if (autoSubmit) {
            if (input.trim() && !isLoading) {
                handleSend();
            }
            setAutoSubmit(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSubmit]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

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

    const deleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation() // Prevent loading the session when clicking delete
        if (!window.confirm("Are you sure you want to delete this conversation?")) return

        try {
            const res = await fetch(`${API_URL}/api/chat/sessions/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setSessions(prev => prev.filter(s => s._id !== id))
                if (currentSessionId === id) {
                    startNewChat()
                }
            } else {
                console.error("Failed to delete session")
            }
        } catch (err) {
            console.error("Failed to delete session", err)
        }
    }

    const handleSend = async (e?: React.FormEvent, customInput?: string) => {
        if (e) e.preventDefault()
        
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch(err) {}
        }
        setIsListening(false);

        const messageToSend = customInput || input
        if (!messageToSend.trim() || isLoading) return

        const userMessage = messageToSend.trim()
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
                    throw new Error(errData.details || 'Failed to analyze symptoms');
                } catch (e) {
                    throw new Error('Failed to analyze symptoms');
                }
            }

            const data = await response.json()
            setMessages([...newMessages, { role: 'system', content: data.response }])

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

    const handleVoiceInput = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser doesn't support speech recognition.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        let transcriptBuffer = input;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                transcriptBuffer += (transcriptBuffer.endsWith(' ') || !transcriptBuffer ? '' : ' ') + finalTranscript;
            }

            const displayTranscript = transcriptBuffer + (transcriptBuffer && interimTranscript ? ' ' : '') + interimTranscript;
            setInput(displayTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            if (event.error === 'network') {
                alert("Speech recognition failed due to a network error. If you are using Brave or a privacy-focused browser, the built-in speech API might be blocked. Please try using Chrome, Edge, or Safari.");
            } else if (event.error === 'not-allowed') {
                alert("Microphone access was denied. Please allow microphone access in your browser settings to use voice chat.");
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            setAutoSubmit(true);
        };

        recognition.start();
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.role === 'user') {
            if (Array.isArray(msg.content)) {
                const textPart = msg.content.find(p => p.type === 'text')?.text;
                const imgPart = msg.content.find(p => p.type === 'image_url')?.image_url?.url;
                return (
                    <div className="user-message-content">
                        {imgPart && <img src={imgPart} alt="Uploaded Symptom" className="uploaded-symptom-img" />}
                        {textPart && <p>{textPart}</p>}
                    </div>
                );
            }
            return <p>{msg.content as string}</p>
        } else if (typeof msg.content === 'string') {
            return <p>{msg.content}</p>
        }

        const aiData = msg.content as ParsedAIResponse;

        if (aiData.type === 'chat' && aiData.message) {
            return <p>{aiData.message}</p>
        }

        const riskClass = aiData.riskLevel?.toLowerCase() || 'low';

        return (
            <div className="ai-diagnosis-card">
                <div className="ai-diagnosis-header">
                    <div className="ai-diagnosis-title-group">
                        <Stethoscope className="ai-diagnosis-icon" size={18} />
                        <h4 className="ai-condition">{aiData.condition || 'Analysis Complete'}</h4>
                    </div>
                    <span className={`ai-risk-badge ${riskClass}`}>
                        {aiData.riskLevel || 'Low'} Risk
                    </span>
                </div>

                <div className="ai-diagnosis-section">
                    <div className="ai-section-header">
                        <Info size={14} className="section-icon" />
                        <span className="ai-section-label">Reasoning</span>
                    </div>
                    <p className="ai-section-text">{aiData.reason}</p>
                </div>

                {aiData.medicines && (
                    <div className="ai-diagnosis-section highlight">
                        <div className="ai-section-header">
                            <Pill size={14} className="section-icon" />
                            <span className="ai-section-label">Suggested Medicines</span>
                        </div>
                        <p className="ai-section-text">{aiData.medicines}</p>
                    </div>
                )}

                <div className="ai-diagnosis-footer">
                    <div className="ai-section-header">
                        <ChevronRight size={14} className="section-icon" />
                        <span className="ai-section-label">Next Step Recommendation</span>
                    </div>
                    <p className="ai-next-step-text">{aiData.nextStep}</p>
                </div>
            </div>
        )
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-page-container">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="chat-sidebar-overlay" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`chat-history-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-action" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={startNewChat} className="btn-new-chat" style={{ flex: 1 }}>
                        <MessageSquarePlus size={18} />
                        <span>New Conversation</span>
                    </button>
                    <button 
                        className="mobile-sidebar-close" 
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-sessions">
                    <h3 className="sidebar-label">Recent History</h3>
                    <div className="sessions-scroll">
                        {sessions.map(session => (
                            <div
                                key={session._id}
                                onClick={() => loadSession(session._id)}
                                className={`session-item ${currentSessionId === session._id ? 'active' : ''}`}
                            >
                                <div className="session-main-content">
                                    <MessageSquare size={16} className="session-icon" />
                                    <div className="session-info">
                                        <span className="session-title">{session.title}</span>
                                        <span className="session-preview">View symptoms analysis</span>
                                    </div>
                                </div>
                                <button
                                    className="btn-delete-session"
                                    onClick={(e) => deleteSession(e, session._id)}
                                    title="Delete session"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="sessions-empty">
                                <MessageSquare size={24} />
                                <p>No chats yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main-container">
                {/* Header Area */}
                <header className="chat-page-header">
                    <div className="header-content">
                        <div className="title-area-container">
                            <button 
                                className="mobile-menu-toggle"
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <Menu size={24} />
                            </button>
                            <div className="title-area">
                                <h1 className="page-title">AI Symptom Checker</h1>
                                <p className="page-subtitle" style={{ display: 'none' }}>Describe your symptoms and receive structured medical insights from AI.</p>
                            </div>
                        </div>
                        <div className="header-badges">
                            <div className="ai-badge">
                                <Bot size={14} />
                                <span>AI-Generated</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Chat Messages */}
                <div className="chat-viewport">
                    <div className="messages-list">
                        {/* Initial Disclaimer */}
                        <div className="disclaimer-alert">
                            <div className="disclaimer-content">
                                <AlertTriangle className="disclaimer-icon" size={18} />
                                <div>
                                    <span className="disclaimer-title">Medical Disclaimer</span>
                                    <p className="disclaimer-text">
                                        This tool provides informational guidance only and does not replace professional medical advice. Always consult with a qualified healthcare provider.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {messages.map((msg, index) => (
                            <div key={index} className={`message-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                <div className="message-avatar-wrap">
                                    {msg.role === 'user' ? (
                                        <div className="avatar user" style={{ padding: user?.photoURL ? 0 : undefined, overflow: 'hidden' }}>
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt={user?.name || "User"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="avatar bot"><Bot size={18} /></div>
                                    )}
                                </div>
                                <div className="message-bubble-wrap">
                                    <div className={`message-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                                        {renderMessageContent(msg)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message-row bot">
                                <div className="message-avatar-wrap">
                                    <div className="avatar bot"><Bot size={18} /></div>
                                </div>
                                <div className="message-bubble-wrap">
                                    <div className="loading-card">
                                        <Loader2 className="spinner" size={18} />
                                        <span>MedAI is analyzing your symptoms...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <footer className="chat-input-container">
                    <div className="input-panel">
                        {/* Tip Link to Body Map */}


                        {/* Quick Suggestions */}
                        <div className="suggestions-bar">
                            {QUICK_SUGGESTIONS.map(symptom => (
                                <button
                                    key={symptom}
                                    className="suggestion-chip"
                                    onClick={() => setInput(symptom)}
                                >
                                    {symptom}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSend} className="modern-chat-input-form">
                            <div className="modern-input-wrapper">
                                <Search className="input-icon-left" size={20} />
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    placeholder="Describe your symptoms (e.g., headache, fever, stomach pain...)"
                                    className="modern-textarea"
                                    rows={1}
                                />
                                <div className="modern-actions-right">
                                    <button 
                                        type="button" 
                                        className={`modern-mic-btn ${isListening ? 'active' : ''}`}
                                        title={isListening ? "Listening... Click to stop" : "Voice Input"}
                                        onClick={handleVoiceInput}
                                    >
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="modern-send-btn"
                                    >
                                        Search
                                    </button>
                                </div>
                            </div>
                        </form>
                        <p className="input-footer">AI results may vary. Consult a professional for critical health decisions.</p>
                    </div>
                </footer>
            </main>
        </div>
    )
}
