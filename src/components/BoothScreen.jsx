import { useState, useEffect, useRef } from 'react'
import './BoothScreen.css'

const FILTERS = [
  { key: 'none',    label: 'Normal',    css: 'none' },
  { key: 'bw',      label: 'B&W',       css: 'grayscale(100%) contrast(1.08)' },
  { key: 'noir',    label: 'Noir',      css: 'grayscale(100%) contrast(1.8) brightness(0.85)' },
  { key: 'vintage', label: 'Vintage',   css: 'sepia(80%) contrast(1.04) brightness(0.91) saturate(1.25)' },
  { key: 'sepia',   label: 'Sepia',     css: 'sepia(100%) contrast(1.05) brightness(0.95)' },
  { key: 'fade',    label: 'Faded',     css: 'grayscale(60%) contrast(0.75) brightness(1.15) saturate(0.6)' },
  { key: 'warm',    label: 'Warm Glow', css: 'saturate(1.6) hue-rotate(-15deg) brightness(1.08) contrast(1.05)' },
  { key: 'dream',   label: 'Dreamy',    css: 'brightness(1.15) contrast(0.85) saturate(0.9)' },
  { key: 'vivid',   label: 'Vivid',     css: 'saturate(2.2) contrast(1.15) brightness(1.05)' },
]

const STRIP_STYLES = [
  { key: 'classic',   label: 'Classic'    },
  { key: 'noir',      label: 'Noir'       },
  { key: 'pink',      label: 'Soft Pink'  },
  { key: 'kodak',     label: 'Kodak'      },
  { key: 'polaroid',  label: 'Polaroid'   },
  { key: 'vaporwave', label: 'Vaporwave'  },
  { key: 'scrapbook', label: 'Scrapbook'  },
  { key: 'contact',   label: 'Contact'    },
]

const STRIP_PATTERNS = [
  { key: 'none',    label: 'None'    },
  { key: 'gingham', label: 'Gingham' },
  { key: 'floral',  label: 'Floral'  },
  { key: 'bows',    label: 'Bows'    },
  { key: 'nature',  label: 'Nature'  },
]

const TITLE_MAX = 22
const wait = ms => new Promise(r => setTimeout(r, ms))
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src })
const getFilterCss = key => FILTERS.find(f => f.key === key)?.css ?? 'none'
const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

function drawCanvasPattern(ctx, patternKey, cw, ch) {
  if (!patternKey || patternKey === 'none') return
  const tile = document.createElement('canvas')
  const tc = tile.getContext('2d')

  if (patternKey === 'gingham') {
    tile.width = 48; tile.height = 48
    tc.fillStyle = 'rgba(255,255,255,0.09)'; tc.fillRect(0, 0, 24, 24); tc.fillRect(24, 24, 24, 24)
    tc.strokeStyle = 'rgba(255,255,255,0.06)'; tc.lineWidth = 1
    tc.strokeRect(0, 0, 48, 48); tc.strokeRect(24, 0, 24, 24); tc.strokeRect(0, 24, 24, 24)
  } else if (patternKey === 'floral') {
    tile.width = 90; tile.height = 90
    const drawFlower = (x, y, r) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        tc.beginPath()
        tc.ellipse(x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5, r, r * 0.55, a, 0, Math.PI * 2)
        tc.fillStyle = 'rgba(255,255,255,0.13)'; tc.fill()
      }
      tc.beginPath(); tc.arc(x, y, r * 0.65, 0, Math.PI * 2)
      tc.fillStyle = 'rgba(255,255,255,0.2)'; tc.fill()
    }
    drawFlower(45, 45, 10)
  } else if (patternKey === 'bows') {
    tile.width = 110; tile.height = 88
    const drawBow = (cx, cy) => {
      tc.fillStyle = 'rgba(255,255,255,0.14)'
      tc.beginPath(); tc.moveTo(cx, cy)
      tc.bezierCurveTo(cx - 22, cy - 18, cx - 38, cy - 12, cx - 30, cy)
      tc.bezierCurveTo(cx - 38, cy + 12, cx - 22, cy + 18, cx, cy); tc.fill()
      tc.beginPath(); tc.moveTo(cx, cy)
      tc.bezierCurveTo(cx + 22, cy - 18, cx + 38, cy - 12, cx + 30, cy)
      tc.bezierCurveTo(cx + 38, cy + 12, cx + 22, cy + 18, cx, cy); tc.fill()
      tc.beginPath(); tc.arc(cx, cy, 6, 0, Math.PI * 2)
      tc.fillStyle = 'rgba(255,255,255,0.22)'; tc.fill()
    }
    drawBow(55, 44)
  } else if (patternKey === 'nature') {
    tile.width = 88; tile.height = 88
    const drawLeaf = (x, y, angle) => {
      tc.save(); tc.translate(x, y); tc.rotate(angle)
      tc.beginPath(); tc.moveTo(0, -18)
      tc.bezierCurveTo(14, -10, 14, 10, 0, 18)
      tc.bezierCurveTo(-14, 10, -14, -10, 0, -18)
      tc.fillStyle = 'rgba(255,255,255,0.11)'; tc.fill()
      tc.beginPath(); tc.moveTo(0, -18); tc.lineTo(0, 18)
      tc.strokeStyle = 'rgba(255,255,255,0.07)'; tc.lineWidth = 1; tc.stroke()
      tc.restore()
    }
    drawLeaf(28, 28, -0.4); drawLeaf(65, 60, 0.8)
  }

  const pat = ctx.createPattern(tile, 'repeat')
  ctx.save()
  ctx.globalAlpha = 0.75
  ctx.fillStyle = pat
  ctx.fillRect(0, 0, cw, ch)
  ctx.restore()
}

async function renderStrip(photos, styleKey, title, patternKey = 'none') {
  await document.fonts.ready
  const imgs = await Promise.all(photos.map(loadImg))
  const PW = 760, PH = 570, PAD = 26, GAP = 12
  const CW = PW + PAD * 2
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (styleKey === 'classic') {
    const HDR = 88, FTR = 58
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, CW, CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = 'rgba(237,232,220,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(5,5,CW-10,CH-10)
    ctx.strokeStyle = 'rgba(237,232,220,0.07)'; ctx.strokeRect(9,9,CW-18,CH-18)
    ctx.textAlign = 'center'; ctx.font = 'italic 900 38px "Playfair Display", Georgia, serif'
    ctx.fillStyle = 'rgba(237,232,220,0.75)'; ctx.fillText(title, CW/2, HDR/2+14)
    ctx.strokeStyle = 'rgba(237,232,220,0.1)'; ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.fillStyle = '#ede8dc'; ctx.fillRect(PAD-5, y-5, PW+10, PH+10)
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.strokeStyle = 'rgba(237,232,220,0.1)'; ctx.beginPath(); ctx.moveTo(PAD,fy); ctx.lineTo(CW-PAD,fy); ctx.stroke()
    ctx.fillStyle = 'rgba(237,232,220,0.45)'; ctx.font = '15px "Special Elite", monospace'; ctx.fillText(todayStr(), CW/2, fy+26)
    ctx.fillStyle = 'rgba(237,232,220,0.18)'; ctx.font = '12px "Special Elite", monospace'; ctx.fillText('digital photo booth', CW/2, fy+44)

  } else if (styleKey === 'noir') {
    const HDR = 80, FTR = 52
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#030303'; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.strokeRect(4,4,CW-8,CH-8)
    ctx.textAlign = 'center'; ctx.font = '900 28px "Special Elite", monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.fillText(title.toUpperCase(), CW/2, HDR/2+11)
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.strokeRect(PAD,y,PW,PH)
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '14px "Special Elite", monospace'; ctx.fillText(todayStr(), CW/2, fy+28)

  } else if (styleKey === 'pink') {
    const HDR = 96, FTR = 60
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#fce4ec'; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 2.5; ctx.strokeRect(5,5,CW-10,CH-10)
    ctx.lineWidth = 1; ctx.strokeRect(12,12,CW-24,CH-24)
    ctx.textAlign = 'center'; ctx.font = 'italic 900 40px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#ad1457'; ctx.fillText(title, CW/2, 52)
    ctx.font = '18px serif'; ctx.fillStyle = '#f48fb1'; ctx.fillText('♥  ♥  ♥', CW/2, 78)
    ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.fillStyle = '#fff'; ctx.fillRect(PAD-7, y-7, PW+14, PH+14)
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.strokeStyle = '#f48fb1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PAD,fy); ctx.lineTo(CW-PAD,fy); ctx.stroke()
    ctx.fillStyle = '#ad1457'; ctx.globalAlpha = 0.65
    ctx.font = 'italic 15px "Playfair Display", Georgia, serif'; ctx.fillText(todayStr(), CW/2, fy+30)
    ctx.globalAlpha = 1

  } else if (styleKey === 'kodak') {
    const HDR = 100, FTR = 72
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#f5c800'; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(4,4,CW-8,CH-8)
    ctx.lineWidth = 1.5; ctx.strokeRect(11,11,CW-22,CH-22)
    ctx.textAlign = 'center'; ctx.font = '900 42px "Special Elite", monospace'
    ctx.fillStyle = '#111'; ctx.fillText(title.toUpperCase(), CW/2, 56)
    ctx.font = '13px "Special Elite", monospace'; ctx.fillText('PRINT · KEEP · SHARE', CW/2, 80)
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.fillStyle = '#fff'; ctx.fillRect(PAD-9, y-9, PW+18, PH+18)
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(PAD-9, y-9, PW+18, PH+18)
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PAD,fy); ctx.lineTo(CW-PAD,fy); ctx.stroke()
    ctx.fillStyle = '#111'; ctx.font = '900 16px "Special Elite", monospace'; ctx.fillText(todayStr().toUpperCase(), CW/2, fy+32)
    ctx.globalAlpha = 0.55; ctx.font = '13px "Special Elite", monospace'; ctx.fillText('MEMORIES CAPTURED · EST. 2025', CW/2, fy+54)
    ctx.globalAlpha = 1

  } else if (styleKey === 'polaroid') {
    const PPOL_W = 720, SIDE = 20, BOT = 72
    const PHOTO_W = PPOL_W - SIDE * 2
    const PHOTO_H = Math.round(PHOTO_W * 3/4)
    const PPOL_H = SIDE + PHOTO_H + BOT
    const PPOL_X = (CW - PPOL_W) / 2
    const HDR = 72, FTR = 48, GAP_P = 18
    canvas.width = CW; canvas.height = HDR + PAD + (PPOL_H + GAP_P) * 4 - GAP_P + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#e8e3d8'; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.textAlign = 'center'; ctx.font = 'italic 700 30px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#4a3828'; ctx.globalAlpha = 0.7; ctx.fillText(title, CW/2, HDR/2+12); ctx.globalAlpha = 1
    for (let i = 0; i < 4; i++) {
      const fy = HDR + PAD + i * (PPOL_H + GAP_P)
      ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5
      ctx.fillStyle = '#fff'; ctx.fillRect(PPOL_X, fy, PPOL_W, PPOL_H)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      ctx.drawImage(imgs[i], PPOL_X+SIDE, fy+SIDE, PHOTO_W, PHOTO_H)
      ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PPOL_X+30, fy+SIDE+PHOTO_H+44); ctx.lineTo(PPOL_X+PPOL_W-30, fy+SIDE+PHOTO_H+44); ctx.stroke()
    }
    const footY = HDR + PAD + 4*PPOL_H + 3*GAP_P + PAD
    ctx.fillStyle = '#4a3828'; ctx.globalAlpha = 0.4; ctx.font = '14px "Special Elite", monospace'; ctx.fillText(todayStr(), CW/2, footY+26); ctx.globalAlpha = 1

  } else if (styleKey === 'vaporwave') {
    const HDR = 88, FTR = 58
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    const bgGrad = ctx.createLinearGradient(0,0,0,CH)
    bgGrad.addColorStop(0,'#1a0533'); bgGrad.addColorStop(0.5,'#2a0445'); bgGrad.addColorStop(1,'#0f0120')
    ctx.fillStyle = bgGrad; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = 'rgba(180,0,255,0.07)'; ctx.lineWidth = 1
    for (let x = 0; x < CW; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CH); ctx.stroke() }
    for (let y = 0; y < CH; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke() }
    const hGrad = ctx.createLinearGradient(100,0,CW-100,0)
    hGrad.addColorStop(0,'#ff00cc'); hGrad.addColorStop(0.5,'#cc00ff'); hGrad.addColorStop(1,'#00eeff')
    ctx.textAlign = 'center'; ctx.font = '900 32px "Special Elite", monospace'
    ctx.fillStyle = hGrad; ctx.fillText(title.toUpperCase(), CW/2, HDR/2+13)
    ctx.strokeStyle = '#cc00ff'; ctx.lineWidth = 1; ctx.shadowColor = '#cc00ff'; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
      ctx.strokeStyle = '#00eeff'; ctx.lineWidth = 2; ctx.shadowColor = '#00eeff'; ctx.shadowBlur = 8
      ctx.strokeRect(PAD, y, PW, PH); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.strokeStyle = '#ff00cc'; ctx.lineWidth = 1; ctx.shadowColor = '#ff00cc'; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.moveTo(PAD,fy); ctx.lineTo(CW-PAD,fy); ctx.stroke()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0
    ctx.fillStyle = '#ff00cc'; ctx.globalAlpha = 0.85; ctx.font = '15px "Special Elite", monospace'; ctx.fillText(todayStr(), CW/2, fy+28)
    ctx.fillStyle = '#00eeff'; ctx.globalAlpha = 0.5; ctx.font = '11px "Special Elite", monospace'; ctx.fillText('DIGITAL PHOTO BOOTH', CW/2, fy+46)
    ctx.globalAlpha = 1

  } else if (styleKey === 'scrapbook') {
    const HDR = 88, FTR = 68
    canvas.width = CW; canvas.height = HDR + PAD + (PH + GAP) * 4 - GAP + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#c4956a'; ctx.fillRect(0,0,CW,CH)
    ctx.fillStyle = '#cda17a'; ctx.fillRect(6,6,CW-12,CH-12)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.strokeStyle = '#8b5e3c'; ctx.lineWidth = 3; ctx.strokeRect(4,4,CW-8,CH-8)
    ctx.textAlign = 'center'; ctx.font = 'italic 800 42px "Playfair Display", Georgia, serif'
    ctx.fillStyle = '#3d1f0a'; ctx.globalAlpha = 0.85; ctx.fillText(title, CW/2, HDR/2+18); ctx.globalAlpha = 1
    ctx.setLineDash([6,4]); ctx.strokeStyle = 'rgba(61,31,10,0.25)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(PAD,HDR); ctx.lineTo(CW-PAD,HDR); ctx.stroke(); ctx.setLineDash([])
    const drawTape = (tx, ty, angle) => {
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(angle)
      ctx.fillStyle = 'rgba(245,238,200,0.75)'; ctx.fillRect(-22,-7,44,14); ctx.restore()
    }
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH + GAP)
      ctx.shadowColor = 'rgba(61,31,10,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3
      ctx.fillStyle = '#f5f0e8'; ctx.fillRect(PAD-8, y-8, PW+16, PH+16)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0
      ctx.drawImage(imgs[i], PAD, y, PW, PH)
      drawTape(PAD-8+16,    y-8+6,    -0.3)
      drawTape(PAD+PW+8-16, y-8+6,     0.3)
      drawTape(PAD-8+16,    y+PH+8-6,  0.3)
      drawTape(PAD+PW+8-16, y+PH+8-6, -0.3)
    }
    const fy = HDR + PAD + 4*PH + 3*GAP + PAD
    ctx.setLineDash([6,4]); ctx.strokeStyle = 'rgba(61,31,10,0.25)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(PAD,fy); ctx.lineTo(CW-PAD,fy); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#3d1f0a'; ctx.globalAlpha = 0.65; ctx.font = 'italic 16px "Playfair Display", Georgia, serif'; ctx.fillText(todayStr(), CW/2, fy+30)
    ctx.globalAlpha = 0.4; ctx.font = '12px "Special Elite", monospace'; ctx.fillText('photo booth memories', CW/2, fy+52)
    ctx.globalAlpha = 1

  } else if (styleKey === 'contact') {
    const ML = 48, PW_C = CW - ML - PAD, PH_C = Math.round(PW_C * 3/4)
    const HDR = 56, FTR = 52, GAP_C = 8
    canvas.width = CW; canvas.height = HDR + PAD + (PH_C + GAP_C) * 4 - GAP_C + PAD + FTR
    const CH = canvas.height
    ctx.fillStyle = '#181818'; ctx.fillRect(0,0,CW,CH)
    drawCanvasPattern(ctx, patternKey, CW, CH)
    ctx.textAlign = 'left'; ctx.font = '12px "Special Elite", monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillText(`${title.toUpperCase()} · ISO 400 · F/2.8 · 1/60`, ML, 32)
    for (let y = 0; y < CH; y += 36) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.arc(16, y+16, 7, 0, Math.PI*2); ctx.fill()
    }
    for (let i = 0; i < 4; i++) {
      const y = HDR + PAD + i * (PH_C + GAP_C)
      ctx.textAlign = 'right'; ctx.font = '11px "Special Elite", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillText(`0${i+1}`, ML-8, y + PH_C/2 + 4)
      ctx.drawImage(imgs[i], ML, y, PW_C, PH_C)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(ML, y, PW_C, PH_C)
    }
    const fy = HDR + PAD + 4*PH_C + 3*GAP_C + PAD
    const d = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    ctx.textAlign = 'left'; ctx.font = '11px "Special Elite", monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillText(`DATE: ${d}   DIGITAL PHOTO BOOTH   4 EXPOSURES`, ML, fy+28)
  }

  return canvas
}

export default function BoothScreen({ onExit }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const busyRef = useRef(false)
  const photosRef = useRef([])

  const [currentFilter, setCurrentFilter] = useState('none')
  const [stripStyle, setStripStyle] = useState('classic')
  const [stripPattern, setStripPattern] = useState('none')
  const [stripTitle, setStripTitle] = useState('Photo Booth')
  const [photos, setPhotos] = useState([])
  const [status, setStatus] = useState('Ready when you are.')
  const [statusLit, setStatusLit] = useState(false)
  const [countdownNum, setCountdownNum] = useState(null)
  const [showSmile, setShowSmile] = useState(false)
  const [flashKey, setFlashKey] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  const [noCameraMsg, setNoCameraMsg] = useState(false)
  const [captureDisabled, setCaptureDisabled] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [stripDate] = useState(() =>
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  )

  useEffect(() => {
    let localStream = null
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
      audio: false,
    }).then(s => {
      localStream = s
      streamRef.current = s
      if (videoRef.current) videoRef.current.srcObject = s
      setNoCameraMsg(false)
    }).catch(() => {
      setNoCameraMsg(true)
      setCaptureDisabled(true)
    })
    return () => { if (localStream) localStream.getTracks().forEach(t => t.stop()) }
  }, [])

  const updateStatus = (msg, lit = false) => { setStatus(msg); setStatusLit(lit) }

  const captureFrame = () => {
    const W = 1280, H = 960
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.translate(W, 0); ctx.scale(-1, 1)
    const f = getFilterCss(currentFilter)
    if (f !== 'none') ctx.filter = f
    ctx.drawImage(videoRef.current, 0, 0, W, H)
    return canvas.toDataURL('image/jpeg', 0.93)
  }

  const doCountdown = async n => { setCountdownNum(n); await wait(880); setCountdownNum(null); await wait(80) }
  const doSmile = async () => { setShowSmile(true); await wait(700); setShowSmile(false) }
  const doFlash = () => { setShowFlash(true); setFlashKey(k => k+1); setTimeout(() => setShowFlash(false), 400) }

  const runBooth = async () => {
    if (busyRef.current || !streamRef.current) return
    busyRef.current = true; setBusy(true); setCaptureDisabled(true)
    for (let i = photosRef.current.length; i < 4; i++) {
      updateStatus(`Photo ${i+1} of 4 — get ready.`)
      await wait(300)
      await doCountdown(3); await doCountdown(2); await doCountdown(1)
      doSmile(); await wait(280); doFlash()
      const dataURL = captureFrame()
      photosRef.current = [...photosRef.current, dataURL]
      setPhotos([...photosRef.current])
      updateStatus('Nice.', true)
      await wait(i < 3 ? 500 : 200)
    }
    busyRef.current = false; setBusy(false)
    setPrinting(true)
    setDone(true)
    setTimeout(() => setPrinting(false), 5500)
  }

  const handleReset = () => {
    photosRef.current = []; busyRef.current = false
    setBusy(false); setPhotos([]); setCaptureDisabled(false); setDone(false); setPrinting(false)
    updateStatus('Ready when you are.')
  }

  const handleDownload = async () => {
    if (photosRef.current.length < 4) return
    const title = stripTitle.trim() || 'Photo Booth'
    const canvas = await renderStrip(photosRef.current, stripStyle, title, stripPattern)
    const a = document.createElement('a')
    a.download = `photobooth-${Date.now()}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  const handleTitleChange = e => {
    if (e.target.value.length <= TITLE_MAX) setStripTitle(e.target.value)
  }

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="booth-interior">
        <div className="booth-topbar">
          <span className="booth-brand">Photo Booth</span>
          <button className="booth-exit" onClick={onExit}>← exit</button>
        </div>

        <div className="done-view">
          <div className="done-header">
            <h2 className="done-heading">Your photos are ready!</h2>
            <p className={`done-print-status ${printing ? '' : 'done-print-done'}`}>
              {printing ? '▸ printing your strip...' : '✓ all done'}
            </p>
          </div>

          <div className="done-content">
            {/* Strip — prints out of delivery tray slot */}
            <div className="print-tray">
              {/* The slot the strip feeds through */}
              <div className="print-slot-housing">
                <div className="print-slot">
                  {printing && <div className="printer-scan-light" />}
                </div>
              </div>
              <div className={`strip-card strip-card-done strip-style-${stripStyle}${stripPattern !== 'none' ? ` strip-pattern-${stripPattern}` : ''} strip-printing`}>
                <div className="strip-card-title">{stripTitle || 'Photo Booth'}</div>
                <div className="strip-slots">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="strip-slot filled">
                      <img src={photos[i]} alt={`Photo ${i+1}`} />
                    </div>
                  ))}
                </div>
                <div className="strip-card-foot">{stripDate}</div>
              </div>
            </div>

            {/* Actions — fade in after strip finishes printing */}
            <div className={`done-actions ${printing ? 'done-actions-waiting' : 'done-actions-ready'}`}>
              <div className="done-field">
                <label className="done-field-label">Customize title</label>
                <div className="strip-title-row">
                  <input
                    className="strip-title-input"
                    value={stripTitle}
                    onChange={handleTitleChange}
                    placeholder="Photo Booth"
                    spellCheck={false}
                  />
                  <span className={`strip-title-count ${stripTitle.length >= TITLE_MAX ? 'at-limit' : ''}`}>
                    {stripTitle.length}/{TITLE_MAX}
                  </span>
                </div>
              </div>

              <div className="done-field">
                <label className="done-field-label">Pick a style</label>
                <div className="strip-style-chips">
                  {STRIP_STYLES.map(s => (
                    <button
                      key={s.key}
                      className={`style-chip style-chip-${s.key} ${stripStyle === s.key ? 'active' : ''}`}
                      onClick={() => setStripStyle(s.key)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="done-field">
                <label className="done-field-label">Add a pattern</label>
                <div className="pattern-chips">
                  {STRIP_PATTERNS.map(p => (
                    <button
                      key={p.key}
                      className={`pattern-chip pattern-chip-${p.key} ${stripPattern === p.key ? 'active' : ''}`}
                      onClick={() => setStripPattern(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="done-download-btn" onClick={handleDownload}>
                Download Strip
              </button>
              <button className="done-reset-btn" onClick={handleReset}>
                Take New Photos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SHOOTING SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="booth-interior">
      <div className="booth-topbar">
        <span className="booth-brand">Photo Booth</span>
        <button className="booth-exit" onClick={onExit}>← exit</button>
      </div>

      <div className="booth-main">

        {/* Left: filters + controls */}
        <div className="booth-controls-col">
          <div className="filter-section">
            <div className="filter-label-head">Select a filter</div>
            <div className="filter-btns">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn ${currentFilter === key ? 'active' : ''}`}
                  onClick={() => { if (!busyRef.current) setCurrentFilter(key) }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="dot-row">
            {[0,1,2,3].map(i => (
              <div key={i} className={`dot ${photos[i] ? 'taken' : ''}`} />
            ))}
          </div>

          <button className="capture-btn" disabled={captureDisabled} onClick={runBooth}>
            Start Booth
          </button>
          <div className={`status-text ${statusLit ? 'lit' : ''}`}>{status}</div>
        </div>

        {/* Center: viewfinder */}
        <div className="viewfinder-col">
          <div className="look-here-bar">
            <div className="look-here-line" />
            <div className="look-here-center">
              <div className="look-here-dot" />
              <span className="look-here-text">look here</span>
              <div className="look-here-dot" />
            </div>
            <div className="look-here-line" />
          </div>

          <div className="cam-frame">
            <video ref={videoRef} autoPlay playsInline muted
              style={{ filter: getFilterCss(currentFilter) }} className="cam-video" />
            <div className="cam-grain" />
            <div className="cam-vignette" />
            <div className="corner-screw screw-tl" /><div className="corner-screw screw-tr" />
            <div className="corner-screw screw-bl" /><div className="corner-screw screw-br" />
            <div className={`status-light ${busy ? 'red' : 'green'}`} />
            {countdownNum !== null && (
              <div className="cam-overlay">
                <div key={countdownNum} className="countdown-num animate">{countdownNum}</div>
              </div>
            )}
            {showSmile && (
              <div className="cam-overlay">
                <div key="smile" className="smile-text animate">Smile.</div>
              </div>
            )}
            {showFlash && <div key={flashKey} className="flash snap" />}
            {noCameraMsg && (
              <div className="no-camera-msg">
                <svg width="48" height="48" fill="none" stroke="rgba(237,232,220,0.3)" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                </svg>
                <p>Allow camera access<br/>to get started</p>
              </div>
            )}
          </div>

          {/* Steps guide — shown before shooting, replaced by progress during shooting */}
          {photos.length === 0 && !busy ? (
            <div className="steps-guide">
              <div className="step-card">
                <span className="step-badge">1</span>
                <span className="step-label">Choose a filter</span>
              </div>
              <div className="step-divider">
                <svg viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 7 Q8 3 14 7 Q8 11 1 7Z" stroke="none" fill="rgba(237,232,220,0.12)" />
                  <path d="M2 7 C6 5 11 5 16 7" stroke="rgba(237,232,220,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  <path d="M13 4.5 L17 7 L13 9.5" stroke="rgba(237,232,220,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="step-card">
                <span className="step-badge">2</span>
                <span className="step-label">Pick a strip style</span>
              </div>
              <div className="step-divider">
                <svg viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 7 Q8 3 14 7 Q8 11 1 7Z" stroke="none" fill="rgba(237,232,220,0.12)" />
                  <path d="M2 7 C6 5 11 5 16 7" stroke="rgba(237,232,220,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  <path d="M13 4.5 L17 7 L13 9.5" stroke="rgba(237,232,220,0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="step-card">
                <span className="step-badge">3</span>
                <span className="step-label">Hit Start Booth</span>
              </div>
            </div>
          ) : (
            <div className="instruction-strip">
              {[
                { n: '1', text: 'Stay still' },
                { n: '2', text: 'Watch the countdown' },
                { n: '3', text: 'Pose when red light blinks' },
                { n: '4', text: 'Repeat × 4' },
              ].map(({ n, text }) => (
                <div key={n} className="instr-step">
                  <span className="instr-num">{n}</span>
                  <span className="instr-text">{text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pose-label">
            <span className="pose-word">POSE</span>
            <span className="pose-sub">WHEN RED LIGHT IS ON</span>
          </div>
        </div>

        {/* Right: strip preview + controls */}
        <div className="booth-strip-col">
          <div className="strip-label">Customize your title</div>

          <div className="strip-title-row">
            <input
              className="strip-title-input"
              value={stripTitle}
              onChange={handleTitleChange}
              placeholder="Photo Booth"
              spellCheck={false}
            />
            <span className={`strip-title-count ${stripTitle.length >= TITLE_MAX ? 'at-limit' : ''}`}>
              {stripTitle.length}/{TITLE_MAX}
            </span>
          </div>

          <div className="strip-style-section">
            <div className="strip-style-head">Pick a style</div>
            <div className="strip-style-chips">
              {STRIP_STYLES.map(s => (
                <button
                  key={s.key}
                  className={`style-chip style-chip-${s.key} ${stripStyle === s.key ? 'active' : ''}`}
                  onClick={() => setStripStyle(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="strip-pattern-section">
            <div className="strip-style-head" style={{marginBottom:'0.35rem'}}>Add a pattern</div>
            <div className="pattern-chips">
              {STRIP_PATTERNS.map(p => (
                <button
                  key={p.key}
                  className={`pattern-chip pattern-chip-${p.key} ${stripPattern === p.key ? 'active' : ''}`}
                  onClick={() => setStripPattern(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`strip-card strip-style-${stripStyle}${stripPattern !== 'none' ? ` strip-pattern-${stripPattern}` : ''}`}>
            <div className="strip-card-title">{stripTitle || 'Photo Booth'}</div>
            <div className="strip-slots">
              {[0,1,2,3].map(i => (
                <div key={i} className={`strip-slot ${photos[i] ? 'filled' : ''}`}>
                  {photos[i]
                    ? <img src={photos[i]} alt={`Photo ${i+1}`} />
                    : <span className="slot-num">{i+1}</span>
                  }
                </div>
              ))}
            </div>
            <div className="strip-card-foot">{stripDate}</div>
          </div>
        </div>

      </div>
    </div>
  )
}
