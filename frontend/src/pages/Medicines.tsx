import { useState, useEffect, useRef } from 'react'
import { Search, Info, ShieldAlert, Activity, AlertTriangle, Pill, Loader2 } from 'lucide-react'

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
            const response = await fetch('http://localhost:5000/api/medicine/lookup', {
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

    const riskColor =
        medicineData?.risk === 'low' ? 'bg-teal/15 text-teal-dark border-teal/20' :
            medicineData?.risk === 'moderate' ? 'bg-warn/15 text-[#8A6100] border-warn/20' :
                'bg-danger/15 text-danger border-danger/20'

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-extrabold text-navy leading-tight mb-2">
                    Medicine Database
                </h1>
                <p className="text-[13px] text-text-muted max-w-2xl">
                    Search for medicines to securely understand usage, dosages, typical side effects, and warnings derived by AI.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative flex items-center gap-3 bg-white border-[1.5px] border-gray-200 rounded-xl p-3 shadow-sm mb-10 focus-within:border-teal transition-colors">
                <Search className="text-gray-400 ml-2" size={20} />
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
                    className="flex-1 border-none outline-none text-[14px] font-sans text-text-body bg-transparent placeholder:text-gray-400"
                    disabled={isLoading}
                    autoComplete="off"
                />
                <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isLoading}
                    className="bg-navy text-white px-5 py-2 rounded-lg text-[13px] font-medium hover:bg-slate transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                    {isLoading && <Loader2 size={14} className="animate-spin" />}
                    {isLoading ? 'Searching...' : 'Search'}
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        ref={dropdownRef}
                        className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 shadow-lg rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                        {suggestions.map((suggestion, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSearchQuery(suggestion)
                                    setShowSuggestions(false)
                                    // Optional: automatically search immediately after click
                                    // handleSearch() - wait, we need state to update first, better to just set query
                                }}
                                className="px-5 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                            >
                                <Search size={14} className="text-gray-400" />
                                <span className="text-[14px] text-text-body font-medium">{suggestion}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-md p-4 flex items-center gap-3 text-danger text-[13px] font-medium mb-10">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Result Card */}
            {medicineData && (
                <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-card animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="font-display text-xl font-bold text-navy mb-2">{medicineData.name}</h2>
                            <span className="text-[10px] font-mono bg-navy/5 text-gray-500 px-3 py-1.5 rounded-full uppercase tracking-wider border border-navy/10">
                                {medicineData.category}
                            </span>
                        </div>
                        {medicineData.risk !== 'low' && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase ${riskColor}`}>
                                <AlertTriangle size={12} />
                                Risk: {medicineData.risk}
                            </span>
                        )}
                        {medicineData.risk === 'low' && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase ${riskColor}`}>
                                <ShieldAlert size={12} />
                                Risk: {medicineData.risk}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-6">
                            <div>
                                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1.5">
                                    <Info size={12} /> What it is used for
                                </div>
                                <div className="text-[13px] text-text-body leading-relaxed">{medicineData.usedFor}</div>
                            </div>

                            <div>
                                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1.5">
                                    <Activity size={12} /> How it works
                                </div>
                                <div className="text-[13px] text-text-body leading-relaxed">{medicineData.howItWorks}</div>
                            </div>

                            <div>
                                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1.5">
                                    <Pill size={12} /> Typical Dosage
                                </div>
                                <div className="text-[13px] text-text-body font-medium leading-relaxed">{medicineData.typicalDosage}</div>
                                <div className="text-[11px] text-gray-400 mt-1.5 italic">*General guidance only. Not medical advice. Always consult a healthcare professional.</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 bg-gray-100/50 p-5 rounded-xl border border-gray-100 h-fit">
                            <div>
                                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.08em] mb-2 flex items-center gap-1.5">
                                    <ShieldAlert size={12} /> Common Side Effects
                                </div>
                                <ul className="list-disc list-inside text-[13px] text-text-body space-y-1.5 marker:text-teal/60">
                                    {medicineData.sideEffects.map((effect, idx) => (
                                        <li key={idx}>{effect}</li>
                                    ))}
                                </ul>
                            </div>

                            {medicineData.warnings && (
                                <div className="mt-2 text-danger">
                                    <div className="text-[10px] font-mono uppercase tracking-[0.08em] mb-1.5 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Important Warnings
                                    </div>
                                    <div className="text-[13px] font-medium leading-relaxed bg-danger/5 p-3 rounded-md border border-danger/10">
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
