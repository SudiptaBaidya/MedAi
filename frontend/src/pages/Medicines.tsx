import { useState, useEffect, useRef } from 'react'
import { Search, Info, ShieldAlert, Activity, AlertTriangle, Pill, Loader2, Mic, Bot, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react'
import './Medicines.css'

// Define the expected structure from the backend AI
interface ParsedMedicineResponse {
    name: string;
    category: string;
    usedFor: string;
    howItWorks: string;
    typicalDosage: string;
    sideEffects: string[];
    warnings: string;
    risk: 'low' | 'moderate' | 'high' | 'unavailable';
    safetyScore: number | null;
    similarMedicines: string[];
}

export default function Medicines() {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com';
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [medicineData, setMedicineData] = useState<ParsedMedicineResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isListening, setIsListening] = useState(false)
    const [autoSubmit, setAutoSubmit] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const recognitionRef = useRef<any>(null)

    const quickSuggestions = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Cetirizine']

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch autocomplete recommendations
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${searchQuery}&ef=DISPLAY_NAME`)
                if (response.ok) {
                    const data = await response.json()
                    if (data[1] && Array.isArray(data[1])) {
                        // Clean up names by removing everything inside parentheses
                        const rawNames = data[1] as string[]
                        const cleanNames = rawNames.map(n => n.replace(/\s*\(.*?\)\s*/g, '').trim())
                        // Remove duplicates and limit to 5
                        const uniqueNames = Array.from(new Set(cleanNames)).slice(0, 5)
                        setSuggestions(uniqueNames)
                    }
                }
            } catch (err) {
                console.error("Autocomplete fetch error", err)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const handleSearch = async (query?: string) => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch(err) {}
        }
        setIsListening(false);

        const term = query || searchQuery
        if (!term.trim() || isLoading) return

        setIsLoading(true)
        setError(null)
        setMedicineData(null) // Clear previous result
        setShowSuggestions(false)
        if (query) setSearchQuery(query)

        try {
            const response = await fetch(`${API_URL}/api/medicine/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineName: term })
            })

            if (!response.ok) {
                throw new Error('Failed to fetch medicine data.')
            }

            const data = await response.json()
            
            // Robust data mapping for similarMedicines
            const rawSimilar = data.similarMedicines || data.similar_medicines || data.SimilarMedicines || [];
            data.similarMedicines = Array.isArray(rawSimilar) ? rawSimilar : [rawSimilar];

            setMedicineData(data)

        } catch (err: any) {
            console.error(err)
            setError("We couldn't find detailed information for that query. Please try another name or check your spelling.")
        } finally {
            setIsLoading(false)
        }
    }

    const getRiskConfig = (risk: string, score: number | null) => {
        switch (risk) {
            case 'low':
                return { 
                    label: 'Low Risk', 
                    class: 'risk-badge-low', 
                    score: score ?? 90, 
                    color: '#10b981', 
                    hint: 'Generally safe for most adults' 
                }
            case 'moderate':
                return { 
                    label: 'Moderate Risk', 
                    class: 'risk-badge-moderate', 
                    score: score ?? 60, 
                    color: '#f59e0b', 
                    hint: 'Requires careful attention' 
                }
            case 'high':
                return { 
                    label: 'High Risk', 
                    class: 'risk-badge-high', 
                    score: score ?? 30, 
                    color: '#ef4444', 
                    hint: 'Higher potential for side effects' 
                }
            case 'unavailable':
            default:
                return { 
                    label: 'Risk data unavailable', 
                    class: '', 
                    score: 0, 
                    color: '#6b7280', 
                    hint: 'Insufficient data' 
                }
        }
    }

    const riskConfig = medicineData ? getRiskConfig(medicineData.risk, medicineData.safetyScore) : null

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

        let transcriptBuffer = searchQuery;

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
            setSearchQuery(displayTranscript);
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

    useEffect(() => {
        if (autoSubmit) {
            if (searchQuery.trim() && !isLoading) {
                setShowSuggestions(false);
                handleSearch();
            }
            setAutoSubmit(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoSubmit]);

    return (
        <div className="medicines-container">
            {/* 1. Page Header */}
            <div className="medicines-header">
                <h1 className="medicines-title">
                    Medicine Intelligence Database
                </h1>
                <p className="medicines-subtitle">
                    Search medicines to understand their uses, dosage, side effects, and safety insights powered by AI.
                </p>

                {/* Search Bar Section */}
                <div className="search-section">
                    <div className="search-bar-wrapper">
                        <Search className="inner-search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search for a medicine (e.g., Amoxicillin, Paracetamol)"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => {
                                if (suggestions.length > 0) setShowSuggestions(true)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setShowSuggestions(false)
                                    handleSearch()
                                }
                            }}
                            className="enhanced-search-input"
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        <button
                            className={`voice-btn ${isListening ? 'active' : ''}`}
                            title={isListening ? "Listening... Click to stop" : "Voice search"}
                            onClick={handleVoiceInput}
                        >
                            <Mic size={18} />
                        </button>
                        <button
                            onClick={() => handleSearch()}
                            disabled={!searchQuery.trim() || isLoading}
                            className="enhanced-search-btn"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Search"}
                        </button>

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div ref={dropdownRef} className="modern-autocomplete-dropdown">
                                {suggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSearchQuery(suggestion)
                                            setShowSuggestions(false)
                                            handleSearch(suggestion)
                                        }}
                                        className="modern-autocomplete-item"
                                    >
                                        <Search size={14} className="suggestion-icon" />
                                        <span>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Quick Medicine Suggestions */}
                    <div className="suggestions-chips">
                        <span className="suggestions-label">Popular:</span>
                        {quickSuggestions.map((med) => (
                            <button
                                key={med}
                                className="suggestion-chip"
                                onClick={() => handleSearch(med)}
                            >
                                {med}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="modern-error-message">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Result Content */}
            {medicineData && (
                <div className="medicine-results-layout animate-fade-in">
                    {/* 3. Medicine Overview Card */}
                    <div className="overview-card">
                        <div className="overview-header">
                            <div className="medicine-identity">
                                <div className="pills-icon">
                                    <Pill size={24} />
                                </div>
                                <div>
                                    <h2 className="med-main-name">{medicineData.name}</h2>
                                    <div className="overview-badges">
                                        <span className="med-type-badge">
                                            <ShieldCheck size={12} />
                                            {medicineData.category || 'Medicine'}
                                        </span>
                                        <span className={`risk-badge-v2 ${riskConfig?.class}`}>
                                            {medicineData.risk === 'low' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                                            {riskConfig?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 6. Medicine Safety Score Visualization */}
                            <div className="safety-score-container">
                                <div className="safety-score-header">
                                    <span className="safety-label">Safety Score</span>
                                    <span className="safety-value" style={{ color: riskConfig?.color }}>
                                        {riskConfig?.score !== 0 ? `${riskConfig?.score}/100` : '—'}
                                    </span>
                                </div>
                                <div className="safety-progress-wrapper">
                                    <div
                                        className="safety-progress-bar"
                                        style={{
                                            width: `${riskConfig?.score || 0}%`,
                                            backgroundColor: riskConfig?.color
                                        }}
                                    ></div>
                                </div>
                                <p className="safety-hint">{riskConfig?.hint}</p>
                            </div>
                        </div>

                        {/* 4. Medicine Information Layout (Two Columns) */}
                        <div className="med-details-columns">
                            {/* Left Column: General Info */}
                            <div className="med-column">
                                <h3 className="column-title">Medicine Information</h3>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <Info size={16} className="section-icon info" />
                                        <h4>What it is used for</h4>
                                    </div>
                                    <div className="section-content">
                                        <p>{medicineData.usedFor}</p>
                                    </div>
                                </div>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <Activity size={16} className="section-icon activity" />
                                        <h4>How it works</h4>
                                    </div>
                                    <div className="section-content">
                                        <p>{medicineData.howItWorks}</p>
                                    </div>
                                </div>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <Pill size={16} className="section-icon pill" />
                                        <h4>Typical dosage</h4>
                                    </div>
                                    <div className="section-content">
                                        <p>{medicineData.typicalDosage}</p>
                                    </div>
                                </div>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <ShieldCheck size={16} className="section-icon safety" />
                                        <h4>Precautions</h4>
                                    </div>
                                    <div className="section-content">
                                        <p>Check with your doctor if you have allergies to similar medications or underlying conditions.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Safety Information */}
                            <div className="med-column">
                                <h3 className="column-title">Safety Information</h3>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <AlertTriangle size={16} className="section-icon warning" />
                                        <h4>Common Side Effects</h4>
                                    </div>
                                    <ul className="modern-bullets">
                                        {medicineData.sideEffects.slice(0, 5).map((effect, idx) => (
                                            <li key={idx}><CheckCircle2 size={14} className="bullet-icon" /> {effect}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="med-info-section">
                                    <div className="section-head">
                                        <Zap size={16} className="section-icon interaction" />
                                        <h4>Drug Interactions</h4>
                                    </div>
                                    <div className="section-content">
                                        <p>Consult a healthcare professional regarding other medications you are currently taking.</p>
                                    </div>
                                </div>

                                {medicineData.warnings && (
                                    <div className="med-info-section critical">
                                        <div className="section-head">
                                            <AlertTriangle size={16} className="section-icon danger" />
                                            <h4>Important Warnings</h4>
                                        </div>
                                        <div className="section-content">
                                            <p>{medicineData.warnings}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. AI Explanation Section */}
                        <div className="ai-explanation-panel">
                            <div className="ai-panel-header">
                                <Bot size={20} className="ai-icon" />
                                <h3>AI Explanation</h3>
                            </div>
                            <div className="ai-content">
                                <p>
                                    {medicineData.name} {medicineData.howItWorks.toLowerCase().includes('bacteria') ? 'is an antibiotic' : 'is a medication'} primarily designed to help manage {medicineData.usedFor.toLowerCase()}. It works by {medicineData.howItWorks.toLowerCase()}. Always follow professional medical advice for your specific health needs.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 7. Related Medicines Section */}
                    <div className="related-medicines-section">
                        <h3 className="related-title">Similar Medicines</h3>
                        <div className="related-grid">
                            {medicineData.similarMedicines && medicineData.similarMedicines.length > 0 ? (
                                medicineData.similarMedicines.map((medName, idx) => (
                                    medName.toLowerCase().includes('no similar') ? (
                                        <p key={idx} className="no-related-fallback">{medName}</p>
                                    ) : (
                                        <div key={idx} className="related-mini-card">
                                            <h4>{medName}</h4>
                                            <p>Clinical alternative or similar drug class.</p>
                                            <button
                                                className="view-related-btn"
                                                onClick={() => handleSearch(medName)}
                                            >
                                                View Details <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )
                                ))
                            ) : (
                                <p className="no-related-fallback">No similar medicines found for this drug.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
