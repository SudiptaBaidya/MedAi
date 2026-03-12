import { useState, useRef, useEffect } from 'react'
import { UploadCloud, FileText, AlertTriangle, Loader2, Info, Activity, ShieldAlert, X, File as FileIcon, Clock, ChevronRight, Camera, CheckCircle, AlertCircle, Pill, ArrowRight, Trash2, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Reports.css'

interface HistoryItem {
    id: string;
    filename: string;
    date: string;
    data: ParsedReportResponse;
}

interface ParsedReportResponse {
    summary: string;
    keyFindings: string[];
    symptomsNoted: string[];
    jargonExplained: { term: string, explanation: string }[];
    disclaimer: string;
}

export default function Reports() {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medai-utym.onrender.com';
    const { token } = useAuth();
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [compressedBase64, setCompressedBase64] = useState<string | null>(null)
    const [isPdf, setIsPdf] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [reportData, setReportData] = useState<ParsedReportResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showAllFindings, setShowAllFindings] = useState(false)

    // History State
    const [reportHistory, setReportHistory] = useState<HistoryItem[]>([])
    const [isHistoryLoading, setIsHistoryLoading] = useState(true)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const MAX_DIMENSION = 1200; // Resize large images
    const QUALITY = 0.7; // 70% JPEG quality

    // Load history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) {
                setIsHistoryLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_URL}/api/reports/history`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReportHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch report history", err);
            } finally {
                setIsHistoryLoading(false);
            }
        };

        fetchHistory();
    }, [token, API_URL])

    const processFile = (file: File) => {
        // Prevent massive files
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large. Please select a file under 10MB.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setReportData(null);
        setFileName(file.name);

        if (file.type === 'application/pdf') {
            setIsPdf(true);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                setCompressedBase64(event.target?.result as string);
                setImagePreview("pdf_preview"); // truthy value to switch UI state
                setIsLoading(false);
            };
            reader.onerror = () => {
                setError("Failed to read PDF file.");
                setIsLoading(false);
            };
            return;
        }

        setIsPdf(false);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                // Compression Logic
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', QUALITY);

                    setImagePreview(event.target?.result as string); // Show original or lightly compressed preview
                    setCompressedBase64(compressedDataUrl); // The safe payload
                    setIsLoading(false);
                } else {
                    setError("Failed to compress image due to browser limitations.");
                    setIsLoading(false);
                }
            };
            img.onerror = () => {
                setError("Failed to read image file.");
                setIsLoading(false);
            }
        };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                setError("Please upload an image file (JPG, PNG) or a PDF.");
                return;
            }
            processFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                setError("Please upload an image file (JPG, PNG) or a PDF.");
                return;
            }
            processFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = () => {
        setImagePreview(null);
        setCompressedBase64(null);
        setIsPdf(false);
        setFileName(null);
        setReportData(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const analyzeReport = async () => {
        if (!compressedBase64 || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/reports/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: compressedBase64 })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to analyze report.');
            }

            const data = await response.json();
            setReportData(data);

            // Save to Database
            if (token) {
                const saveResponse = await fetch(`${API_URL}/api/reports/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        filename: fileName || "Analyzed Report",
                        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                        data: data
                    })
                });

                if (saveResponse.ok) {
                    const savedReport = await saveResponse.json();
                    // Update state to render instantly in sidebar without refresh
                    const mappedReport = { ...savedReport, id: savedReport._id || savedReport.id };
                    setReportHistory(prev => [mappedReport, ...prev]);
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred while analyzing the report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistoryItem = (item: HistoryItem) => {
        // Reset the active upload state
        setImagePreview(null);
        setCompressedBase64(null);
        setIsPdf(false);
        setFileName(item.filename);
        setError(null);

        // Load the stored data
        setReportData(item.data);

        // Scroll to top to ensure user sees the loaded report
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent card click
        if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;

        try {
            const response = await fetch(`${API_URL}/api/reports/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setReportHistory(prev => prev.filter(report => report.id !== id));
                // If it was the active report, clear it
                if (reportData && activeReport && (activeReport as any).id === id) {
                    removeFile();
                }
            } else {
                throw new Error("Failed to delete report.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to delete the report. Please try again.");
        }
    }

    const handleDownloadPDF = (item: HistoryItem, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent card click

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Report Insight - ${item.filename}</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                            .header { display: flex; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }
                            .header-content h1 { color: #0d9488; margin: 0 0 5px 0; font-size: 24px; }
                            .header-content p { margin: 0; color: #64748b; font-size: 14px; }
                            h2 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; font-size: 18px; }
                            ul { padding-left: 20px; margin-top: 10px; }
                            li { margin-bottom: 8px; }
                            .risk-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 12px; text-transform: uppercase; float: right; margin-top: 10px; }
                            .risk-High { background: #fee2e2; color: #ef4444; }
                            .risk-Medium { background: #fef3c7; color: #d97706; }
                            .risk-Low { background: #d1fae5; color: #10b981; }
                            .summary-box { background: #f8fafc; border-left: 4px solid #0d9488; padding: 15px; margin-top: 15px; border-radius: 0 8px 8px 0; }
                            .tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
                            .tag { background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
                            .disclaimer { margin-top: 50px; padding: 20px; background: #fffbeb; color: #b45309; font-size: 12px; border: 1px solid #fde68a; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="header-content">
                                <h1>MedAI Report Analysis</h1>
                                <p><strong>File:</strong> ${item.filename}</p>
                                <p><strong>Analyzed on:</strong> ${item.date}</p>
                            </div>
                            <div class="risk-badge risk-${getRiskLevel(item.data)}">Risk: ${getRiskLevel(item.data)}</div>
                        </div>
                        
                        <h2>AI Recommendation</h2>
                        <div class="summary-box">
                            ${item.data.summary}
                        </div>
                        
                        <h2>Key Findings</h2>
                        <ul>
                            ${item.data.keyFindings.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        
                        ${item.data.symptomsNoted?.length > 0 ? `
                        <h2>Symptoms Noted</h2>
                        <div class="tags">
                            ${item.data.symptomsNoted.map(s => `<span class="tag">${s}</span>`).join('')}
                        </div>
                        ` : ''}
                        
                        ${item.data.jargonExplained?.length > 0 ? `
                        <h2>Medical Jargon Explained</h2>
                        <ul>
                            ${item.data.jargonExplained.map(j => `<li><strong>${j.term}:</strong> ${j.explanation}</li>`).join('')}
                        </ul>
                        ` : ''}
                        
                        <div class="disclaimer">
                            <strong>Notice:</strong> ${item.data.disclaimer}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();

            // Allow fonts to load before triggering print
            setTimeout(() => {
                printWindow.print();
                // We keep window open for them to view if they cancel the print, or they can close it.
            }, 500);
        }
    }

    const getRiskLevel = (data: ParsedReportResponse) => {
        const text = JSON.stringify(data).toLowerCase();
        if (text.includes('critical') || text.includes('high risk') || text.includes('severe') || text.includes('urgent')) return 'High';
        if (text.includes('moderate') || text.includes('abnormal') || text.includes('elevated') || text.includes('concern')) return 'Medium';
        return 'Low';
    }

    const getRiskBadge = (data: ParsedReportResponse) => {
        const risk = getRiskLevel(data);
        if (risk === 'High') return <span className="risk-badge high"><AlertTriangle size={14} /> High</span>
        if (risk === 'Medium') return <span className="risk-badge medium"><AlertCircle size={14} /> Medium</span>
        return <span className="risk-badge low"><CheckCircle size={14} /> Low</span>
    }

    // Determine what to show in insights. Precedence: Active uploaded/selected report -> Last history item
    const activeReport = reportData
        ? { filename: fileName || "Analyzed Report", data: reportData }
        : (reportHistory.length > 0 && !imagePreview ? reportHistory[0] : null);

    // Calculate mock stats based on available data
    const totalIssues = reportHistory.reduce((acc, report) => acc + (report.data.keyFindings?.length || 0), 0) + (reportData ? (reportData.keyFindings?.length || 0) : 0);
    const totalConcepts = reportHistory.reduce((acc, report) => acc + (report.data.jargonExplained?.length || 0), 0) + (reportData ? (reportData.jargonExplained?.length || 0) : 0);

    return (
        <div className="reports-container">
            {/* 1. Page Header */}
            <div className="reports-header-modern">
                <div className="header-text">
                    <h1 className="reports-title">Medical Report Analyzer</h1>
                    <p className="reports-subtitle">
                        Our AI breaks down complex medical jargon and explains your results in simple terms.
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn-modern btn-outline" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud size={18} /> Upload Report
                    </button>
                    <button className="btn-modern btn-primary">
                        <Camera size={18} /> Scan Report
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-alert fade-in-up">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}

            <div className="dashboard-grid">
                {/* 2. AI Health Insights Panel (Left) */}
                <div className="dashboard-card insights-card">
                    <div className="card-header">
                        <h2><Activity size={20} className="icon-teal" /> AI Health Insights</h2>
                    </div>

                    {activeReport ? (
                        <div className="insights-content fade-in-up">
                            <div className="insight-top-bar">
                                <div className="report-name-group">
                                    <FileText size={16} className="icon-teal" />
                                    <span className="insight-filename">{activeReport.filename}</span>
                                </div>
                                {getRiskBadge(activeReport.data)}
                            </div>

                            <div className="insight-section">
                                <h3>Key Findings</h3>
                                <ul className="insight-findings">
                                    {(showAllFindings ? activeReport.data.keyFindings : activeReport.data.keyFindings.slice(0, 4)).map((finding, idx) => (
                                        <li key={idx}>
                                            <div className="bullet-point"></div>
                                            <span>{finding}</span>
                                        </li>
                                    ))}
                                </ul>
                                {activeReport.data.keyFindings.length > 4 && (
                                    <button
                                        className="btn-link mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                                        onClick={() => setShowAllFindings(!showAllFindings)}
                                    >
                                        {showAllFindings ? 'Show Less' : `+ ${activeReport.data.keyFindings.length - 4} more findings...`}
                                    </button>
                                )}
                            </div>

                            <div className="insight-section">
                                <h3>AI Recommendation</h3>
                                <div className="recommendation-box">
                                    <Info size={16} className="info-icon" />
                                    <p>{activeReport.data.summary}</p>
                                </div>
                            </div>

                            {(activeReport.data.symptomsNoted?.length > 0) && (
                                <div className="insight-details">
                                    <div className="insight-section">
                                        <h3>Noted Symptoms</h3>
                                        <div className="tag-cloud">
                                            {activeReport.data.symptomsNoted.map((sym, i) => <span key={i} className="symptom-tag">{sym}</span>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="disclaimer-mini mt-auto">
                                <ShieldAlert size={16} />
                                <span>{activeReport.data.disclaimer}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="insights-empty">
                            <div className="empty-icon-bg">
                                <Activity size={32} />
                            </div>
                            <h3>No Insights Yet</h3>
                            <p>Upload a medical report to get AI-powered analysis, risk assessment, and simplified explanations.</p>
                        </div>
                    )}
                </div>

                {/* 3. Upload Report Card (Right) */}
                <div className="dashboard-card upload-wrapper">
                    <div className="card-header">
                        <h2><UploadCloud size={20} className="icon-teal" /> Upload Report</h2>
                    </div>

                    {((!imagePreview && !reportData) || (reportData && !imagePreview)) ? (
                        <div
                            className="modern-dropzone"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="image/jpeg, image/png, image/webp, application/pdf"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <div className="dropzone-content">
                                <div className="dropzone-icon">
                                    <UploadCloud size={36} />
                                </div>
                                <h3>Drag & Drop medical report here</h3>
                                <span className="browse-btn">Browse Files</span>
                                <p className="file-support-text">Supports JPG, PNG, PDF</p>
                                <p className="file-size-text">Max size: 10MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="active-upload-area fade-in-up">
                            <div className="preview-container-modern">
                                <button onClick={removeFile} className="remove-btn-modern" title="Clear file">
                                    <X size={16} />
                                </button>
                                {isPdf ? (
                                    <div className="pdf-preview-modern">
                                        <FileIcon size={48} className="text-red" style={{ color: '#ef4444' }} />
                                        <p className="truncated-name">{fileName}</p>
                                        <span className="badge-pdf">PDF Document Selected</span>
                                    </div>
                                ) : (
                                    <img src={imagePreview!} alt="Report preview" className="img-preview-modern" />
                                )}
                            </div>
                            <button
                                className="analyze-btn-modern"
                                onClick={analyzeReport}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Analyzing safely...
                                    </>
                                ) : (
                                    <>
                                        <Activity size={18} />
                                        Analyze & Explain
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Recent Reports Section */}
            <div className="recent-reports-section fade-in-up">
                <div className="section-header">
                    <h2>Recent Reports</h2>
                    {reportHistory.length > 4 && <button className="btn-link">View All <ArrowRight size={16} /></button>}
                </div>

                {isHistoryLoading ? (
                    <div className="empty-horizontal-state">
                        <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto', color: 'var(--color-teal)' }} />
                        <p style={{ marginTop: '1rem' }}>Loading recent reports...</p>
                    </div>
                ) : reportHistory.length > 0 ? (
                    <div className="horizontal-reports-grid">
                        {reportHistory.slice(0, 4).map(item => (
                            <div className="horizontal-card" key={item.id}>
                                <div className="h-card-icon">
                                    <FileText size={20} />
                                </div>
                                <div className="h-card-details">
                                    <h4 className="h-card-title" title={item.filename}>{item.filename}</h4>
                                    <div className="h-card-meta">
                                        <Clock size={12} /> <span>{item.date}</span>
                                    </div>
                                </div>
                                <div className="h-card-risk">
                                    {getRiskBadge(item.data)}
                                </div>

                                <div className="h-card-actions-row">
                                    <button className="btn-icon-soft text-teal" onClick={(e) => handleDownloadPDF(item, e)} title="Download as PDF">
                                        <Download size={16} />
                                    </button>
                                    <button className="h-card-action flex-grow" onClick={() => loadHistoryItem(item)}>
                                        View Details
                                    </button>
                                    <button className="btn-icon-soft text-red" onClick={(e) => handleDeleteReport(item.id, e)} title="Delete Report">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-horizontal-state">
                        <p>No recent reports found. Analyzed medical documents will securely appear here.</p>
                    </div>
                )}
            </div>

            {/* 5. Health Summary Widget */}
            <div className="health-summary-section fade-in-up mb-8">
                <div className="summary-widget-card">
                    <div className="sw-icon bg-blue-subtle text-blue">
                        <FileText size={24} />
                    </div>
                    <div className="sw-info">
                        <span className="sw-value">{reportHistory.length}</span>
                        <span className="sw-label">Reports Analyzed</span>
                    </div>
                </div>

                <div className="summary-widget-card">
                    <div className="sw-icon bg-red-subtle text-red">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="sw-info">
                        <span className="sw-value">{totalIssues}</span>
                        <span className="sw-label">Issues Detected</span>
                    </div>
                </div>

                <div className="summary-widget-card">
                    <div className="sw-icon bg-teal-subtle text-teal">
                        <Info size={24} />
                    </div>
                    <div className="sw-info">
                        <span className="sw-value">{totalConcepts}</span>
                        <span className="sw-label">Concepts Explained</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
