import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// import { supabase } from '../lib/commercial'; // Mocked or removed if not using commercial auth yet
import { LogIn, LogOut, Zap, Info, X } from 'lucide-react';

export const Header: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        // Mocking Pro status for now, since this app is local/standalone
        const finalPro = true;
        (window as any).__isPro = finalPro;
    }, []);

    const login = () => { console.log('Login not implemented in standalone yet'); };
    const logout = () => { setUser(null); };

    return (
        <header className="toolkit-header">
            <div className="header-left">
                <div className="toolkit-brand">
                    <svg className="brand-icon" viewBox="0 0 48 48" fill="none">
                        <path d="M14 40 Q14 34 18 30 Q14 26 18 22 Q14 18 18 14" stroke="#7c5cfc" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
                        <path d="M24 42 Q24 36 28 32 Q24 28 28 24 Q24 20 28 16 Q24 12 28 8" stroke="#7c5cfc" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9"/>
                        <path d="M34 40 Q34 34 30 30 Q34 26 30 22 Q34 18 30 14" stroke="#5ce0fc" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                    </svg>
                    <span className="toolkit-name">Poetic Signal Toolkit</span>
                </div>
                <div className="app-separator">/</div>
                <div className="app-name">Cosmic Swarm</div>
                <button onClick={() => setShowInfo(true)} className="info-btn">
                    <Info className="w-4 h-4" />
                </button>
            </div>

            <div className="header-right">
                {user ? (
                    <div className="user-profile">
                        <div className="pro-badge active">
                            <Zap className="w-3 h-3" />
                            PRO
                        </div>
                        <span className="user-email">{user.email}</span>
                        <button onClick={logout} className="icon-btn" title="Logout">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="user-profile">
                        <div className="pro-badge active">
                            <Zap className="w-3 h-3" />
                            PRO
                        </div>
                        <span className="user-email">Local Mode</span>
                        <button onClick={login} className="icon-btn" title="Login for Sync">
                            <LogIn className="w-4 h-4" />
                        </button>
                    </div>
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
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
                    width: 32px;
                    height: 32px;
                }
                .toolkit-name {
                    font-size: 20px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: #fff;
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
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(255, 255, 255, 0.06);
                    padding: 0.35rem 0.5rem 0.35rem 0.75rem;
                    border-radius: 9999px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .pro-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.7rem;
                    font-weight: 800;
                    padding: 0.2rem 0.5rem;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                }
                .pro-badge.active {
                    background: #f59e0b;
                    color: #fff;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
                }
                .user-email {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    letter-spacing: 0.01em;
                }
                .icon-btn {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.5);
                    cursor: pointer;
                    padding: 0.4rem;
                    display: flex;
                    align-items: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                .icon-btn:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.1);
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
                .info-modal h3 { color: #7c5cfc; font-size: 0.85rem; margin-bottom: 24px; font-weight: 600; }
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
                    <div className="info-modal" onClick={e => e.stopPropagation()}>
                        <button className="info-close" onClick={() => setShowInfo(false)}><X className="w-5 h-5"/></button>
                        <h2>Cosmic Swarm</h2>
                        <h3>Macroscopic & Microscopic Audio-Reactive Entity Engine | 宇宙・微視世界を表現する有機流体エンジン</h3>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>EN</div>
                            <p>Cosmic Swarm is a highly reactive WebGL visualization engine that simulates living organic matter, scaling from cellular division to stellar nebulae. Driven by audio frequency separation, bass kicks induce massive liquid expansion and droplet detachment, while high-frequency treble triggers micro-ripples across the entity's surface. Enhanced with structural color iridescence and metaball physics, it generates poetic, mesmerizing visual signals synchronized perfectly with sound.</p>
                            <ul><li>Key Features: Audio Frequency Separation, Metaball Liquid Fusion, Iridescent Structural Color, Real-time Droplet Physics.</li></ul>
                        </div>

                        <div>
                            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>JP</div>
                            <p>Cosmic Swarmは、細胞分裂から宇宙の星雲に至るまで、生命体のような有機的物質の振る舞いをシミュレートするWebGLビジュアライザ・エンジンです。音域分離技術により、低音（キック）に合わせて流体が大きく膨張・分離し、高音（ハイハット）に呼応して表面に細かな波紋が走ります。メタボールの物理演算と構造色（イリデッセンス）を組み合わせることで、音と完全に同期した詩的で幻惑的なビジュアルシグナルを生成します。</p>
                            <ul><li>主要機能: 周波数帯域ごとのオーディオ・リアクション、流体結合（メタボール）、構造色グラデーション、液滴分離物理。</li></ul>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};
