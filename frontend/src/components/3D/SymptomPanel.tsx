import React, { useEffect, useState } from 'react';
import { Activity, Thermometer, User, Loader2, AlertCircle, CheckSquare, PlusCircle, ArrowLeft, Send, X } from 'lucide-react';
import { useModelInteractions } from '../../hooks/useModelInteractions';

interface AnalysisResult {
  condition: string;
  reason: string;
  riskLevel: string;
  medicines: string;
  nextStep: string;
}

export default function SymptomPanel() {
  const { 
    selectedOrgan, step, selectedSubPart, selectedSymptoms, customInput,
    setStep, setSelectedSubPart, toggleSymptom, setCustomInput, resetWizard
  } = useModelInteractions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [possibleSymptoms, setPossibleSymptoms] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Hardcoded subparts for broad regions
  const getSubparts = (organ: string) => {
    switch (organ.toLowerCase()) {
      case 'torso': return ['Chest', 'Abdomen', 'Upper Back', 'Lower Back'];
      case 'head': return ['Face', 'Scalp', 'Neck', 'Ears', 'Eyes'];
      case 'leg': return ['Thigh', 'Knee', 'Calf', 'Ankle', 'Foot'];
      case 'arm': return ['Shoulder', 'Bicep', 'Elbow', 'Forearm', 'Hand'];
      default: return [];
    }
  };

  // Fetch possible symptoms when entering 'select-symptoms'
  useEffect(() => {
    if (step === 'select-symptoms' && selectedOrgan) {
      const fetchSymptoms = async () => {
        setLoading(true);
        setError(null);
        try {
          const targetPart = selectedSubPart || selectedOrgan;
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${API_URL}/api/chat/generate-symptoms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bodyPart: targetPart })
          });
          
          if (!response.ok) throw new Error('Failed to generate symptoms');
          
          const data = await response.json();
          setPossibleSymptoms(data.symptoms || []);
        } catch (err: any) {
          setError('Could not load common symptoms. You can manually describe them below.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchSymptoms();
    }
  }, [step, selectedOrgan, selectedSubPart]);

  const handleAnalyze = async () => {
    setStep('analyzing');
    setError(null);
    try {
      const targetPart = selectedSubPart || selectedOrgan;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organ: targetPart,
          symptoms: selectedSymptoms,
          customInput: customInput
        })
      });

      if (!response.ok) throw new Error('Failed to analyze symptoms');

      const data = await response.json();
      setAnalysisResult(data);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
      setStep('select-symptoms');
    }
  };

  if (step === 'select-part' || !selectedOrgan) {
    return (
      <div className="symptom-panel empty-state">
        <User size={48} className="empty-icon" />
        <h3>Guided AI Analysis</h3>
        <p>Step 1: Click on any part of the 3D model to begin symptom analysis.</p>
        <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Interactivity enabled: Hover to explore, scroll to zoom.
        </div>
      </div>
    );
  }

  return (
    <div className="symptom-panel slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={24} className="icon-blue" />
          <h2 style={{ margin: 0 }}>{selectedOrgan} Analysis</h2>
        </div>
        <button 
          onClick={resetWizard} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex' }}
          title="Clear selection and start over"
        >
          <X size={20} />
        </button>
      </div>

      <div className="panel-scroll-area" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        
        {step === 'select-subpart' && (
          <div className="wizard-step">
            <h3>Refine Region</h3>
            <p className="hint-text">You selected a broad area. Please specify:</p>
            <div className="button-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {getSubparts(selectedOrgan).map(sub => (
                <button key={sub} className="toggle-btn" onClick={() => setSelectedSubPart(sub)}>
                  {sub}
                </button>
              ))}
              <button className="toggle-btn" style={{ fontStyle: 'italic' }} onClick={() => setSelectedSubPart(null)}>
                Apply to entire {selectedOrgan}
              </button>
            </div>
          </div>
        )}

        {step === 'select-symptoms' && (
          <div className="wizard-step">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <button onClick={() => setStep(getSubparts(selectedOrgan).length > 0 ? 'select-subpart' : 'select-part')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <ArrowLeft size={16} />
              </button>
              <h3>Select Symptoms for {selectedSubPart || selectedOrgan}</h3>
            </div>
            
            {loading ? (
               <div className="loading-state" style={{ padding: '2rem 0' }}>
                 <Loader2 className="spinner" size={24} />
                 <p>Finding common symptoms...</p>
               </div>
            ) : (
              <div className="symptoms-list">
                {error && <div className="hint-text" style={{ color: '#ef4444' }}>{error}</div>}
                
                {possibleSymptoms.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {possibleSymptoms.map(symp => (
                      <label key={symp} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedSymptoms.includes(symp)} 
                          onChange={() => toggleSymptom(symp)} 
                          style={{ width: '1.2rem', height: '1.2rem' }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#334155' }}>{symp}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0', color: '#475569' }}>Can't find your symptom?</h4>
                  <textarea 
                    placeholder="Describe any other symptoms or context here..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
            
            <button 
              className="consult-btn" 
              onClick={handleAnalyze} 
              disabled={loading || (selectedSymptoms.length === 0 && customInput.trim() === '')}
              style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Analyze Symptoms <Send size={16} />
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>MedAI is analyzing your symptoms...</p>
            <div className="skeleton-lines">
               <div className="skeleton-line" />
               <div className="skeleton-line" />
               <div className="skeleton-line short" />
            </div>
          </div>
        )}

        {step === 'results' && analysisResult && (
          <div className="result-content">
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button onClick={() => setStep('select-symptoms')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <ArrowLeft size={16} />
                </button>
                <h3 style={{ margin: 0 }}>Analysis Complete</h3>
             </div>
             
             <div style={{ background: analysisResult.riskLevel.toLowerCase() === 'high' ? '#fef2f2' : '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: `1px solid ${analysisResult.riskLevel.toLowerCase() === 'high' ? '#fecaca' : '#bbf7d0'}` }}>
               <h4 style={{ margin: '0 0 0.5rem 0', color: analysisResult.riskLevel.toLowerCase() === 'high' ? '#dc2626' : '#166534' }}>{analysisResult.condition}</h4>
               <p style={{ margin: 0, fontSize: '0.85rem' }}>Risk Level: <strong>{analysisResult.riskLevel}</strong></p>
             </div>

             <div className="ai-explanation">
                <h3>Reasoning</h3>
                <p>{analysisResult.reason}</p>
             </div>

             {analysisResult.medicines && (
               <div className="ai-explanation" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
                  <h3>Suggested Medications/Remedies</h3>
                  <p>{analysisResult.medicines}</p>
               </div>
             )}

             <div className="ai-explanation" style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
                <h3>Next Steps</h3>
                <p>{analysisResult.nextStep}</p>
             </div>

             <button 
               onClick={resetWizard}
               style={{ 
                 width: '100%', 
                 marginTop: '2rem', 
                 padding: '0.875rem', 
                 background: '#f1f5f9', 
                 color: '#475569', 
                 border: '1px solid #cbd5e1', 
                 borderRadius: '0.5rem',
                 cursor: 'pointer',
                 fontWeight: 600,
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 gap: '0.5rem',
                 transition: 'all 0.2s'
               }}
             >
               <X size={18} /> Close & Start New Analysis
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
