import { useState, useEffect, useRef } from 'react'
import { Search, Info, ShieldAlert, Activity, AlertTriangle, Pill, Loader2 } from 'lucide-react'
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
    risk: 'low' | 'moderate' | 'high';
}

export default function Medicines() {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com';
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [medicineData, setMedicineData] = useState<ParsedMedicineResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    const handleSearch = async () => {
        if (!searchQuery.trim() || isLoading) return

        setIsLoading(true)
        setError(null)
        setMedicineData(null) // Clear previous result
        setShowSuggestions(false)

        try {
            const response = await fetch(`${API_URL}/api/medicine/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicineName: searchQuery })
            })

            if (!response.ok) {
                throw new Error('Failed to fetch medicine data.')
            }

            const data = await response.json()
            setMedicineData(data)

        } catch (err: any) {
            console.error(err)
            setError("We couldn't find detailed information for that query. Please try another name or check your spelling.")
        } finally {
            setIsLoading(false)
        }
    }

    const riskClass = medicineData?.risk === 'low' ? 'risk-badge-low' :
        medicineData?.risk === 'moderate' ? 'risk-badge-moderate' : 'risk-badge-high'

    return (
        <div className="medicines-container">
            <div className="medicines-header">
                <h1 className="medicines-title">
                    Medicine Database
                </h1>
                <p className="medicines-subtitle">
                    Search for medicines to securely understand usage, dosages, typical side effects, and warnings derived by AI.
                </p>
            </div>

            {/* Search Bar */}
            <div className="search-container">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search by medicine name (e.g. Amoxicillin, Ibuprofen)"
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
                    className="search-input"
                    disabled={isLoading}
                    autoComplete="off"
                />
                <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isLoading}
                    className="search-btn"
                >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? 'Searching...' : 'Search'}
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        ref={dropdownRef}
                        className="autocomplete-dropdown"
                    >
                        {suggestions.map((suggestion, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSearchQuery(suggestion)
                                    setShowSuggestions(false)
                                }}
                                className="autocomplete-item"
                            >
                                <Search size={14} className="search-icon" style={{ marginLeft: 0 }} />
                                <span className="autocomplete-text">{suggestion}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Result Card */}
            {medicineData && (
                <div className="result-card">
                    <div className="result-header">
                        <div>
                            <h2 className="medicine-name">{medicineData.name}</h2>
                            <span className="medicine-category">
                                {medicineData.category}
                            </span>
                        </div>

                        <span className={`risk-badge ${riskClass}`}>
                            {medicineData.risk === 'low' ? <ShieldAlert size={12} /> : <AlertTriangle size={12} />}
                            Risk: {medicineData.risk}
                        </span>
                    </div>

                    <div className="details-grid">
                        <div className="info-column">
                            <div className="info-box">
                                <div className="info-label">
                                    <Info size={12} /> What it is used for
                                </div>
                                <div className="info-text">{medicineData.usedFor}</div>
                            </div>

                            <div className="info-box">
                                <div className="info-label">
                                    <Activity size={12} /> How it works
                                </div>
                                <div className="info-text">{medicineData.howItWorks}</div>
                            </div>

                            <div className="info-box">
                                <div className="info-label">
                                    <Pill size={12} /> Typical Dosage
                                </div>
                                <div className="info-text-medium">{medicineData.typicalDosage}</div>
                                <div className="info-disclaimer">*General guidance only. Not medical advice. Always consult a healthcare professional.</div>
                            </div>
                        </div>

                        <div className="side-effects-box">
                            <div>
                                <div className="info-label">
                                    <ShieldAlert size={12} /> Common Side Effects
                                </div>
                                <ul className="effects-list">
                                    {medicineData.sideEffects.map((effect, idx) => (
                                        <li key={idx}>{effect}</li>
                                    ))}
                                </ul>
                            </div>

                            {medicineData.warnings && (
                                <div className="warnings-section">
                                    <div className="info-label" style={{ color: 'var(--color-danger)' }}>
                                        <AlertTriangle size={12} /> Important Warnings
                                    </div>
                                    <div className="warnings-text">
                                        {medicineData.warnings}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
