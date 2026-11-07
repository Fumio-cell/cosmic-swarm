import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';
import { DEMO_MODE } from '../../config';

export const Header: React.FC = () => {
    const [showInfo, setShowInfo] = useState(false);
    const infoButtonRef = useRef<HTMLButtonElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // While the About dialog is open: focus its close button, close on Escape,
    // and hand focus back to the info button afterwards.
    useEffect(() => {
        if (!showInfo) return;
        closeButtonRef.current?.focus();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowInfo(false);
        };
        document.addEventListener('keydown', onKeyDown);
        const infoButton = infoButtonRef.current;
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            infoButton?.focus();
        };
    }, [showInfo]);

    return (
        <header className="toolkit-header">
            <div className="header-left">
                <div className="toolkit-brand">
                    <svg className="brand-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 24 L20 16 L26 24 L20 32 Z"/>
                        <circle cx="20" cy="24" r="1.6" fill="rgba(255,255,255,0.75)" stroke="none"/>
                        <path d="M26 24 L34 24"/>
                        <circle cx="36" cy="24" r="2.4"/>
                    </svg>
                    <span className="toolkit-name">Poetic Signal Toolkit</span>
                </div>
                <div className="app-separator">/</div>
                <div className="app-name">Cosmic Swarm</div>
                <button ref={infoButtonRef} onClick={() => setShowInfo(true)} className="info-btn" aria-label="About Cosmic Swarm">
                    <Info className="w-4 h-4" />
                </button>
            </div>

            <div className="header-right">
                {DEMO_MODE && (
                    <div className="preview-badge">FREE PREVIEW</div>
                )}
            </div>

            <style>{`
                .toolkit-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid #9E3D3F;
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    font-size: 0.875rem;
                }
                .header-left, .header-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .toolkit-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #7c5cfc;
                }
                .brand-icon {
                    width: 28px;
                    height: 28px;
                }
                .toolkit-name {
                    font-family: 'Fraunces', serif;
                    font-size: 18px;
                    font-weight: 500;
                    font-optical-sizing: auto;
                    letter-spacing: 0.01em;
                    color: rgba(255, 255, 255, 0.9);
                }
                .app-separator {
                    color: rgba(255, 255, 255, 0.2);
                    font-weight: 300;
                    margin: 0 0.5rem;
                    font-size: 20px;
                }
                .app-name {
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 20px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                }
                .preview-badge {
                    display: flex;
                    align-items: center;
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 0.25rem 0.65rem;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    color: rgba(255, 255, 255, 0.75);
                    letter-spacing: 0.08em;
                }

                .info-modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
                    display: flex; align-items: center; justify-content: center; z-index: 99999;
                }
                .info-modal {
                    background: #111827; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px; padding: 32px; max-width: 600px;
                    width: 90%; max-height: 85vh; overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    position: relative;
                    text-align: left;
                }
                .info-modal h2 { margin-top: 0; color: #f8fafc; font-size: 1.5rem; }
                .info-modal h3 { color: #9378ff; font-size: 0.85rem; margin-bottom: 24px; font-weight: 600; }
                .info-modal p { color: #cbd5e1; line-height: 1.6; font-size: 0.9rem; margin-bottom: 12px; }
                .info-modal ul { color: #cbd5e1; font-size: 0.85rem; padding-left: 20px; list-style-type: none; margin:0; padding:0; }
                .info-modal li { margin-bottom: 8px; font-weight: 500; color: #94a3b8; }
                .info-close {
                    position: absolute; top: 16px; right: 16px;
                    background: transparent; border: none; color: #64748b;
                    cursor: pointer; padding: 6px; border-radius: 6px; transition: all 0.2s;
                }
                .info-close:hover { color: #f8fafc; background: rgba(255,255,255,0.1); }
                .info-btn {
                    background: transparent; border: none; color: #64748b; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    margin-left: 12px; transition: color 0.2s;
                }
                .info-btn:hover { color: #f8fafc; }
    
            `}</style>
        
            {showInfo && createPortal(
                <div className="info-modal-overlay" onClick={() => setShowInfo(false)}>
                    <div className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" onClick={e => e.stopPropagation()}>
                        <button ref={closeButtonRef} className="info-close" aria-label="Close" onClick={() => setShowInfo(false)}><X className="w-5 h-5"/></button>
                        <h2 id="info-modal-title">Cosmic Swarm</h2>
                        <h3>Macroscopic & Microscopic Audio-Reactive Entity Engine</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>EN</div>
                            <p>Cosmic Swarm is a highly reactive WebGL visualization engine that simulates living organic matter, scaling from cellular division to stellar nebulae. Driven by audio frequency separation, bass kicks induce massive liquid expansion and droplet detachment, while high-frequency treble triggers micro-ripples across the entity's surface. Enhanced with structural color iridescence and metaball physics, it generates poetic, mesmerizing visual signals synchronized perfectly with sound.</p>
                            <ul><li>Key Features: Audio Frequency Separation, Metaball Liquid Fusion, Iridescent Structural Color, Real-time Droplet Physics.</li></ul>
                        </div>

                        <p>Sample track: “Keeper” by Bomb Sun.</p>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};
