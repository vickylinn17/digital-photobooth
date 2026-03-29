import { useState, useRef } from 'react'
import './LandingPage.css'

const LETTERS = 'PHOTOBOOTH'.split('')

export default function LandingPage({ onEnter }) {
  const [phase, setPhase] = useState('idle')
  const phaseRef = useRef('idle')

  const setPhaseSync = (p) => {
    phaseRef.current = p
    setPhase(p)
  }

  const handleCoinHover = () => {
    if (phaseRef.current !== 'idle') return
    document.body.classList.add('cursor-hidden')
    setPhaseSync('inserting')
    // curtains open AND zoom begins together after coin drops
    setTimeout(() => setPhaseSync('zooming'), 700)
    // navigate just as zoom lands (zoom: 1.8s, starts at 700ms → finishes at 2500ms)
    setTimeout(() => onEnter(), 2600)
  }

  // Remove cursor-hidden when component unmounts
  useState(() => () => { document.body.classList.remove('cursor-hidden') })

  const curtainOpen = phase === 'opening' || phase === 'zooming'

  return (
    <div className={`landing phase-${phase}`}>
      {/* Page corner marks */}
      <div className="pg-corner pg-tl" /><div className="pg-corner pg-tr" />
      <div className="pg-corner pg-bl" /><div className="pg-corner pg-br" />

      <p className="landing-tagline">step inside &amp; strike a pose</p>

      {/* ── 3D CABINET ── */}
      <div className="cabinet-scene">
        <div className={`cabinet-3d ${phase === 'zooming' ? 'scene-zooming' : ''}`}>

          {/* PHOTOBOOTH marquee sign */}
          <div className="sign-box">
            <div className="sign-rail sign-rail-top" />
            <div className="sign-tiles">
              {LETTERS.map((l, i) => (
                <div key={i} className="sign-tile">{l}</div>
              ))}
            </div>
            <div className="sign-rail sign-rail-bot" />
          </div>

          {/* Cabinet body */}
          <div className="cabinet-body">
            <p className="cabinet-sub">Take Your Own · 4 Different Poses</p>

            {/* Entrance */}
            <div className="entrance-frame" style={{ cursor: 'none' }}>
              <div className="pelmet">
                <div className="pelmet-screws">
                  <span className="screw" /><span className="screw" />
                </div>
              </div>
              <div className={`entrance ${curtainOpen ? 'curtain-open' : ''}`}>
                <div className="interior">
                  <div className="interior-glow" />
                </div>
                <div className="curtain curtain-l" />
                <div className="curtain curtain-r" />
                <div className="curtain-rod" />
              </div>
            </div>

            {/* Cabinet bottom */}
            <div className="cabinet-bottom">
              <div className="placard">
                <div className="placard-sub">Ready immediately for download</div>
                <div className="placard-main"><em>Forever memories made here</em></div>
              </div>

              {/* Coin slot — hover on desktop, tap on mobile */}
              <div className="coin-zone"
                onMouseEnter={handleCoinHover}
                onClick={handleCoinHover}
              >
                <div className="coin-slot-wrap">
                  <div className="coin-slot-housing">
                    <div className="coin-slot" />
                  </div>
                  {/* Coin drop animation */}
                  <div className={`coin-drop ${phase === 'inserting' ? 'dropping' : ''}`} />
                  <div className="coin-label">INSERT<br/>COIN</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D depth faces */}
          <div className="face-right" />
          <div className="face-bottom" />
        </div>

        {/* Floor shadow */}
        <div className="cabinet-shadow" />

        {/* Hand-drawn loopy arrow — to the right of cabinet, arrowhead points LEFT at coin slot */}
        <div className="start-here">
          <span className="start-here-label">start here</span>
          <svg className="swirl-arrow" viewBox="0 0 165 165" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Loop at top-right, tail sweeps down-left, arrowhead at left pointing toward coin slot */}
            <path
              d="M 140 25 C 158 14 160 44 146 60 C 132 76 108 78 94 64 C 80 50 84 28 100 22 C 116 16 130 28 126 44 C 122 60 108 68 94 64 C 72 58 50 88 32 118 C 20 138 14 144 8 150"
              stroke="#1a1410" strokeWidth="2.4" strokeLinecap="round"
            />
            {/* Arrowhead pointing LEFT toward the coin slot */}
            <path
              d="M 22 142 L 6 150 L 22 158"
              stroke="#1a1410" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Sketchy offset stroke on loop for hand-drawn feel */}
            <path
              d="M 142 27 C 160 16 162 46 148 62 C 134 78 110 80 96 66"
              stroke="#1a1410" strokeWidth="1.3" strokeLinecap="round" opacity="0.3"
            />
          </svg>
        </div>
      </div>

      <p className="hover-hint">
        <span className="hint-arrow">↑</span>
        <span className="hint-desktop">hover the coin slot to peek inside</span>
        <span className="hint-mobile">tap the coin slot to start</span>
      </p>
    </div>
  )
}
