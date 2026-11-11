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
                    <svg className="brand-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 24 L20 16 L26 24 L20 32 Z"/>
                        <circle cx="20" cy="24" r="1.6" fill="currentColor" stroke="none"/>
                        <path d="M26 24 L34 24"/>
                        <circle cx="36" cy="24" r="2.4"/>
                    </svg>
                    <span className="toolkit-name">Poetic Signal Toolkit</span>
                </div>
                <div className="app-separator">/</div>
                <h1 className="app-name">Cosmic Swarm</h1>
                <button ref={infoButtonRef} onClick={() => setShowInfo(true)} className="info-btn" aria-label="About Cosmic Swarm">
                    <Info size={16} />
                </button>
            </div>

            <div className="header-right">
                {DEMO_MODE && (
                    <div className="preview-badge">FREE PREVIEW</div>
                )}
            </div>

            {showInfo && createPortal(
                <div className="info-modal-overlay" onClick={() => setShowInfo(false)}>
                    <div className="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title" onClick={e => e.stopPropagation()}>
                        <button ref={closeButtonRef} className="info-close" aria-label="Close" onClick={() => setShowInfo(false)}><X size={20}/></button>
                        <h2 id="info-modal-title">Cosmic Swarm</h2>
                        <h3>Macroscopic &amp; Microscopic Audio-Reactive Entity Engine</h3>

                        <div className="info-modal-body">
                            <p>Cosmic Swarm is a highly reactive WebGL visualization engine that simulates living organic matter, scaling from cellular division to stellar nebulae. Driven by audio frequency separation, bass kicks induce massive liquid expansion and droplet detachment, while high-frequency treble triggers micro-ripples across the entity's surface. Enhanced with structural color iridescence and metaball physics, it generates poetic, mesmerizing visual signals synchronized perfectly with sound.</p>
                            <ul><li>Key Features: Audio Frequency Separation, Metaball Liquid Fusion, Iridescent Structural Color, Real-time Droplet Physics.</li></ul>
                        </div>

                        <p>Sample track: "Keeper" by Bomb Sun.</p>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};
