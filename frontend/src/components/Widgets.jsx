import { statusBadgeClass, statusLabel } from '../lib/format'

export function ProgressBar({ pct, variant = 'xp' }) {
  const width = Math.max(0, Math.min(100, Number(pct) || 0))
  return (
    <div className="progress-bar-container">
      <div className={`progress-bar ${variant}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusBadgeClass(status)}`}>{statusLabel(status)}</span>
}

export function RarityBadge({ rarity }) {
  return <span className={`badge rarity-badge-${rarity}`}>{rarity}</span>
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub ? <div className="stat-card-sub">{sub}</div> : null}
    </div>
  )
}

// ─── Radar / Pentagon stat chart ─────────────────────────────────────────────
const STAT_KEYS = ['attack', 'defense', 'stamina', 'speed', 'technique']
const STAT_LABELS = { attack: 'ATK', defense: 'DEF', stamina: 'STA', speed: 'SPD', technique: 'TEC' }
const COLORS = { base: '#22c55e', bonus: '#facc15' }
const N = STAT_KEYS.length
const SIZE = 160
const CENTER = SIZE / 2
const RADIUS = SIZE * 0.38
const RINGS = 4

function polar(angle, r) {
  const rad = (angle - Math.PI / 2)
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)]
}

function polygonPoints(values, maxVal = 100) {
  return STAT_KEYS.map((_, i) => {
    const angle = (2 * Math.PI * i) / N
    const r = RADIUS * (Math.min(values[i] || 0, maxVal) / maxVal)
    return polar(angle, r)
  })
}

export function RadarChart({ base = {}, effective = {} }) {
  const maxVal = 100
  const baseVals = STAT_KEYS.map((k) => base[k] || 0)
  const effVals = STAT_KEYS.map((k) => effective[k] || 0)
  const basePoints = polygonPoints(baseVals, maxVal)
  const effPoints = polygonPoints(effVals, maxVal)

  const toPath = (pts) => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + 'Z'

  return (
    <div className="radar-chart-wrapper">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }} aria-hidden="true">
        {/* Grid rings */}
        {Array.from({ length: RINGS }).map((_, ri) => {
          const r = RADIUS * ((ri + 1) / RINGS)
          const pts = Array.from({ length: N }).map((__, i) => {
            const angle = (2 * Math.PI * i) / N
            return polar(angle, r)
          })
          return (
            <polygon
              key={ri}
              points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="none"
              stroke="rgba(134,239,172,0.1)"
              strokeWidth="1"
            />
          )
        })}
        {/* Axis lines */}
        {STAT_KEYS.map((_, i) => {
          const angle = (2 * Math.PI * i) / N
          const [x, y] = polar(angle, RADIUS)
          return (
            <line
              key={i}
              x1={CENTER} y1={CENTER} x2={x} y2={y}
              stroke="rgba(134,239,172,0.1)" strokeWidth="1"
            />
          )
        })}
        {/* Effective (bonus) polygon */}
        {effVals.some((v, i) => v > baseVals[i]) && (
          <path
            d={toPath(effPoints)}
            fill="rgba(250,204,21,0.12)"
            stroke={COLORS.bonus}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
        {/* Base polygon */}
        <path
          d={toPath(basePoints)}
          fill="rgba(34,197,94,0.15)"
          stroke={COLORS.base}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Axis labels */}
        {STAT_KEYS.map((k, i) => {
          const angle = (2 * Math.PI * i) / N
          const [x, y] = polar(angle, RADIUS + 18)
          return (
            <text
              key={k}
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="700"
              fill="rgba(167,196,176,0.7)"
              letterSpacing="0.08em"
            >
              {STAT_LABELS[k]}
            </text>
          )
        })}
        {/* Dot markers on base polygon */}
        {basePoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={COLORS.base} />
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.base, display: 'inline-block' }} />
          Base
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.bonus, display: 'inline-block' }} />
          Effective
        </span>
      </div>
    </div>
  )
}
