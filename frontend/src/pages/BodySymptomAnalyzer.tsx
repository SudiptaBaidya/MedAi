import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stage, ContactShadows, Bounds } from '@react-three/drei';
import Model from '../components/3D/Model';
import ControlsPanel from '../components/3D/ControlsPanel';
import SymptomPanel from '../components/3D/SymptomPanel';
import { Bot, AlertTriangle, Loader2 } from 'lucide-react';
import './BodySymptomAnalyzer.css';

export default function BodySymptomAnalyzer() {
  return (
    <div className="analyzer-page-container">
      <header className="analyzer-header">
        <div className="header-content">
          <div className="title-area">
            <h1 className="page-title">3D AI Symptom Analyzer</h1>
            <p className="page-subtitle">Interact with the 3D model and select body parts to analyze symptoms.</p>
          </div>
          <div className="header-badges">
            <div className="ai-badge">
              <Bot size={14} />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </header>

      <main className="analyzer-layout">
        {/* Left Panel: Controls */}
        <aside className="analyzer-left-panel">
          <ControlsPanel />
        </aside>

        {/* Center: 3D Canvas */}
        <section className="analyzer-center-panel">
          <div className="canvas-container">
            <Suspense fallback={
              <div className="canvas-loading">
                <Loader2 className="spinner" size={32} />
                <p>Loading 3D Anatomy Model...</p>
              </div>
            }>
              <Canvas shadows camera={{ position: [0, 0, 4], fov: 45 }}>
                <color attach="background" args={['#f8fafc']} />
                
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />

                {/* Using Stage for simple environment and bounding box centering */}
                <Stage environment="city" intensity={0.5}>
                  <Bounds fit clip observe margin={1.2}>
                    <Model scale={0.01} /> {/* Scale might need adjustment based on the model */}
                  </Bounds>
                </Stage>

                <OrbitControls 
                  makeDefault 
                  minPolarAngle={Math.PI / 4} 
                  maxPolarAngle={Math.PI / 1.5} 
                  enableZoom={true} 
                  enablePan={true}
                />
              </Canvas>
            </Suspense>
          </div>
          
          <div className="disclaimer-alert">
            <div className="disclaimer-content">
              <AlertTriangle className="disclaimer-icon" size={18} />
              <div>
                <span className="disclaimer-title">Medical Disclaimer</span>
                <p className="disclaimer-text">
                  This tool provides informational guidance only and does not replace professional medical advice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel: Symptom Analysis */}
        <aside className="analyzer-right-panel">
          <SymptomPanel />
        </aside>
      </main>
    </div>
  );
}
