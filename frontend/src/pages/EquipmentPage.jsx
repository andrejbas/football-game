import { useState, useCallback, useRef, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Shield, Hammer, Package, X, ChevronRight } from 'lucide-react'
import { equipmentApi } from '../api/equipment'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'
import { RarityBadge } from '../components/Widgets'

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_SLOTS = ['boots', 'shorts', 'jersey', 'socks', 'charm']
const RARITY_ORDER = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
const RARITY_LABELS = { Q1: 'Common', Q2: 'Uncommon', Q3: 'Rare', Q4: 'Epic', Q5: 'Legendary' }

const SLOT_ICONS = {
  boots: '👟',
  shorts: '🩳',
  jersey: '👕',
  socks: '🧦',
  charm: '🏅',
}

const SLOT_LAYOUT = [
  // Row 1: jersey (head/torso area)
  [{ slot: 'jersey' }],
  // Row 2: charm + shorts
  [{ slot: 'charm' }, { slot: 'shorts' }],
  // Row 3: socks + boots (lower body)
  [{ slot: 'socks' }, { slot: 'boots' }],
]

function rarityKey(item) {
  const r = typeof item.rarity === 'object' ? item.rarity.value || item.rarity : item.rarity
  return String(r).toUpperCase()
}

function slotKey(item) {
  const s = typeof item.slot === 'object' ? item.slot.value || item.slot : item.slot
  return String(s).toLowerCase()
}

function formatBonuses(item) {
  const bonuses = item.bonuses || {}
  return Object.entries(bonuses)
    .filter(([key, value]) => key !== 'total' && Number(value) > 0)
    .map(([key, value]) => `${key} +${value}`)
    .join(' · ')
}

function shortBonuses(item) {
  const bonuses = item.bonuses || {}
  return Object.entries(bonuses)
    .filter(([key, value]) => key !== 'total' && Number(value) > 0)
    .map(([key, value]) => `+${value} ${key.slice(0, 3)}`)
    .join(', ')
}

function totalBonus(item) {
  return item.bonuses?.total ?? 0
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function EquipmentPage() {
  const { data: equipmentList, error, mutate } = useSWR('/equipment', () => equipmentApi.list())
  const { mutate: globalMutate } = useSWRConfig()
  const [activeTab, setActiveTab] = useState('loadout') // 'loadout' | 'merge'
  const [loadingId, setLoadingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [justEquippedSlot, setJustEquippedSlot] = useState(null)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [slotFilter, setSlotFilter] = useState('all')

  // Merge state
  const [mergeSelection, setMergeSelection] = useState([]) // up to 3 item ids
  const [mergeResult, setMergeResult] = useState(null)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeMessage, setMergeMessage] = useState(null)
  const [showFlash, setShowFlash] = useState(false)
  const mergeWorkshopRef = useRef(null)

  // Clear just-equipped animation after timeout
  useEffect(() => {
    if (justEquippedSlot) {
      const t = setTimeout(() => setJustEquippedSlot(null), 700)
      return () => clearTimeout(t)
    }
  }, [justEquippedSlot])

  // Clear flash overlay
  useEffect(() => {
    if (showFlash) {
      const t = setTimeout(() => setShowFlash(false), 900)
      return () => clearTimeout(t)
    }
  }, [showFlash])

  // ─── Derived data ───────────────────────────────────────────────────────

  const equipped = equipmentList ? equipmentList.filter((i) => i.is_equipped) : []
  const unequipped = equipmentList ? equipmentList.filter((i) => !i.is_equipped) : []

  const equippedBySlot = {}
  for (const item of equipped) {
    equippedBySlot[slotKey(item)] = item
  }

  const filteredInventory =
    slotFilter === 'all'
      ? unequipped
      : unequipped.filter((i) => slotKey(i) === slotFilter)

  // Sort inventory by rarity (high to low), then by slot
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const ra = RARITY_ORDER.indexOf(rarityKey(a))
    const rb = RARITY_ORDER.indexOf(rarityKey(b))
    if (rb !== ra) return rb - ra
    return slotKey(a).localeCompare(slotKey(b))
  })

  // Total bonus stats from equipped items
  const totalStats = { attack: 0, defense: 0, stamina: 0, speed: 0, technique: 0 }
  for (const item of equipped) {
    const b = item.bonuses || {}
    for (const stat of Object.keys(totalStats)) {
      totalStats[stat] += Number(b[stat]) || 0
    }
  }

  // ─── Equip / Unequip ───────────────────────────────────────────────────

  const handleEquip = async (item) => {
    setActionError('')
    setLoadingId(item.id)
    try {
      await equipmentApi.equip(item.id)
      setJustEquippedSlot(slotKey(item))
      await mutate()
      globalMutate('/player')
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Unable to equip item.'))
    } finally {
      setLoadingId(null)
    }
  }

  const handleUnequip = async (item) => {
    setActionError('')
    setLoadingId(item.id)
    try {
      await equipmentApi.unequip(item.id)
      await mutate()
      globalMutate('/player')
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Unable to unequip item.'))
    } finally {
      setLoadingId(null)
    }
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e, item) => {
    setDraggingId(item.id)
    e.dataTransfer.setData('application/json', JSON.stringify(item))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOverSlot(null)
  }, [])

  const handleSlotDragOver = useCallback((e, slot) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slot)
  }, [])

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlot(null)
  }, [])

  const handleSlotDrop = useCallback(
    async (e, slot) => {
      e.preventDefault()
      setDragOverSlot(null)
      setDraggingId(null)
      try {
        const item = JSON.parse(e.dataTransfer.getData('application/json'))
        if (slotKey(item) !== slot) {
          setActionError(`This item belongs in the ${slotKey(item)} slot.`)
          return
        }
        await handleEquip(item)
      } catch {
        // ignore parse errors
      }
    },
    [handleEquip]
  )

  // ─── Merge Logic ──────────────────────────────────────────────────────

  const toggleMergeSelect = (item) => {
    setMergeResult(null)
    setMergeMessage(null)

    const isSelected = mergeSelection.includes(item.id)
    if (isSelected) {
      setMergeSelection((prev) => prev.filter((id) => id !== item.id))
      return
    }

    if (mergeSelection.length >= 3) {
      setMergeMessage({ type: 'error', text: 'You can only select 3 items to merge.' })
      return
    }

    // Validate same slot + same rarity
    if (mergeSelection.length > 0) {
      const firstItem = unequipped.find((i) => i.id === mergeSelection[0])
      if (firstItem) {
        if (slotKey(item) !== slotKey(firstItem)) {
          setMergeMessage({ type: 'error', text: 'All items must be the same slot type.' })
          return
        }
        if (rarityKey(item) !== rarityKey(firstItem)) {
          setMergeMessage({ type: 'error', text: 'All items must be the same rarity tier.' })
          return
        }
      }
    }

    if (rarityKey(item) === 'Q5') {
      setMergeMessage({ type: 'error', text: 'Q5 (Legendary) items are already max rarity!' })
      return
    }

    setMergeSelection((prev) => [...prev, item.id])
  }

  const removeMergeSlot = (index) => {
    setMergeSelection((prev) => prev.filter((_, i) => i !== index))
    setMergeResult(null)
    setMergeMessage(null)
  }

  const clearMerge = () => {
    setMergeSelection([])
    setMergeResult(null)
    setMergeMessage(null)
  }

  const handleMerge = async () => {
    if (mergeSelection.length !== 3) return
    setIsMerging(true)
    setMergeMessage(null)
    setMergeResult(null)

    try {
      const result = await equipmentApi.merge(mergeSelection)
      setShowFlash(true)
      setMergeResult(result)
      setMergeSelection([])
      setMergeMessage({
        type: 'success',
        text: `Forge complete! Created ${result.name} (${rarityKey(result)})`,
      })
      await mutate()
      globalMutate('/player')
    } catch (err) {
      setMergeMessage({
        type: 'error',
        text: apiErrorMessage(err, 'Merge failed.'),
      })
    } finally {
      setIsMerging(false)
    }
  }

  const mergeItems = mergeSelection
    .map((id) => unequipped.find((i) => i.id === id))
    .filter(Boolean)

  const canMerge = mergeSelection.length === 3 && !isMerging

  if (error) return <ErrorState error="Failed to load equipment" />
  if (!equipmentList) return <PageLoading label="Loading Equipment..." />

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {showFlash && <div className="merge-flash" />}

      {/* Hero Banner */}
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <Shield size={14} />
          Kit &amp; Gear
        </div>
        <h1 className="text-balance">Equipment Armory</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 560 }}>
          Equip items to boost your stats, or forge 3 same-tier items in the workshop to craft
          a higher quality piece of equipment.
        </p>
      </div>

      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
          <button
            type="button"
            onClick={() => setActionError('')}
            style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="equip-tabs">
        <button
          type="button"
          className={`equip-tab ${activeTab === 'loadout' ? 'active' : ''}`}
          onClick={() => setActiveTab('loadout')}
        >
          <Package size={16} />
          Loadout
        </button>
        <button
          type="button"
          className={`equip-tab ${activeTab === 'merge' ? 'active' : ''}`}
          onClick={() => setActiveTab('merge')}
        >
          <Hammer size={16} />
          Forge
        </button>
      </div>

      {/* ─── LOADOUT TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'loadout' && (
        <div className="equip-layout">
          {/* Slots Panel */}
          <div className="equip-slots-panel">
            <div className="equip-slots-title">⚡ Equipped Gear</div>
            <div className="equip-figure">
              {SLOT_LAYOUT.map((row, ri) => (
                <div className="equip-figure-row" key={ri}>
                  {row.map(({ slot }) => {
                    const item = equippedBySlot[slot]
                    const rk = item ? rarityKey(item).toLowerCase() : null
                    return (
                      <div
                        key={slot}
                        className={[
                          'equip-slot',
                          item ? 'filled' : '',
                          item && justEquippedSlot === slot ? 'just-equipped' : '',
                          dragOverSlot === slot ? 'drag-over' : '',
                          rk ? `rarity-glow-${rk}` : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onDragOver={(e) => handleSlotDragOver(e, slot)}
                        onDragLeave={handleSlotDragLeave}
                        onDrop={(e) => handleSlotDrop(e, slot)}
                        onClick={() => item && handleUnequip(item)}
                        title={item ? `Click to unequip ${item.name}` : `Drag a ${slot} item here`}
                      >
                        {item ? (
                          <>
                            <button
                              className="equip-slot-unequip"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnequip(item)
                              }}
                              title="Unequip"
                              type="button"
                            >
                              <X size={12} />
                            </button>
                            <div className="equip-slot-item">
                              <span className={`equip-slot-item-rarity rarity-badge-${rarityKey(item)}`}>
                                {rarityKey(item)}
                              </span>
                              <span className="equip-slot-item-name">{item.name}</span>
                              <span className="equip-slot-item-stats">+{totalBonus(item)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="equip-slot-icon">{SLOT_ICONS[slot]}</span>
                            <span className="equip-slot-label">{slot}</span>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="equip-stats-summary">
              <div className="equip-stats-summary-title">🛡️ Total Gear Bonuses</div>
              {Object.entries(totalStats).map(([stat, val]) => (
                <div className="equip-stats-row" key={stat}>
                  <span className="stat-name">{stat}</span>
                  <span className="stat-bonus">+{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Panel */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <div>
                <span className="inventory-title">Inventory</span>
                <span className="inventory-count" style={{ marginLeft: 10 }}>
                  {sortedInventory.length} items
                </span>
              </div>
              <div className="inventory-filters">
                <button
                  type="button"
                  className={`inventory-filter ${slotFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('all')}
                >
                  All
                </button>
                {ALL_SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`inventory-filter ${slotFilter === s ? 'active' : ''}`}
                    onClick={() => setSlotFilter(s)}
                  >
                    {SLOT_ICONS[s]} {s}
                  </button>
                ))}
              </div>
            </div>

            {sortedInventory.length === 0 ? (
              <EmptyState
                title="No Items"
                desc={slotFilter === 'all' ? 'Your inventory is empty.' : `No ${slotFilter} items in inventory.`}
              />
            ) : (
              <div className="inventory-grid">
                {sortedInventory.map((item) => (
                  <div
                    key={item.id}
                    className={[
                      'inv-card',
                      `rarity-${rarityKey(item).toLowerCase()}`,
                      draggingId === item.id ? 'dragging' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleEquip(item)}
                    title={`Click or drag to equip ${item.name}`}
                  >
                    <div className="inv-card-meta">
                      <span className="inv-card-slot">
                        {SLOT_ICONS[slotKey(item)]} {slotKey(item)}
                      </span>
                      <RarityBadge rarity={rarityKey(item)} />
                    </div>
                    <div className="inv-card-name">{item.name}</div>
                    <div className="inv-card-stats">
                      {shortBonuses(item) || `+${totalBonus(item)} total`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MERGE TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'merge' && (
        <div className="flex flex-col gap-6">
          {/* Merge Workshop */}
          <div className="merge-workshop" ref={mergeWorkshopRef}>
            <div className="merge-title">⚒️ Equipment Forge</div>
            <div className="merge-subtitle">
              Select 3 items of the <strong>same slot</strong> and <strong>same rarity</strong> to
              forge them into a single higher-quality item. Items are consumed in the process.
            </div>

            <div className="merge-arena">
              {/* Input Slots */}
              <div className="merge-inputs">
                {[0, 1, 2].map((idx) => {
                  const item = mergeItems[idx]
                  return (
                    <div
                      key={idx}
                      className={`merge-slot ${item ? 'filled' : 'empty'}`}
                    >
                      {item ? (
                        <>
                          <button
                            className="merge-slot-remove"
                            onClick={() => removeMergeSlot(idx)}
                            title="Remove"
                            type="button"
                          >
                            <X size={10} />
                          </button>
                          <div className="merge-slot-item">
                            <span className={`equip-slot-item-rarity rarity-badge-${rarityKey(item)}`}>
                              {rarityKey(item)}
                            </span>
                            <span className="merge-slot-item-name">{item.name}</span>
                            <span className="equip-slot-item-stats">
                              +{totalBonus(item)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="merge-slot-plus">+</span>
                          <span className="merge-slot-label">Slot {idx + 1}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Arrow */}
              <div className="merge-arrow">
                <span className="merge-arrow-icon">
                  <ChevronRight size={28} />
                </span>
                <span className="merge-arrow-label">Forge</span>
              </div>

              {/* Result */}
              <div className={`merge-result ${mergeResult ? 'has-result' : ''}`}>
                {mergeResult ? (
                  <>
                    <span className={`equip-slot-item-rarity rarity-badge-${rarityKey(mergeResult)}`}>
                      {rarityKey(mergeResult)} — {RARITY_LABELS[rarityKey(mergeResult)]}
                    </span>
                    <span className="merge-result-item-name">{mergeResult.name}</span>
                    <span className="merge-result-item-stats">
                      {shortBonuses(mergeResult)}
                    </span>
                    <span className="merge-result-item-stats" style={{ opacity: 0.7 }}>
                      Total: +{totalBonus(mergeResult)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="merge-result-qmark">?</span>
                    <span className="merge-result-label">Result</span>
                  </>
                )}
              </div>
            </div>

            {/* Merge Button */}
            <div className="merge-actions">
              <button
                type="button"
                className={`btn-merge ${isMerging ? 'forging' : ''}`}
                disabled={!canMerge}
                onClick={handleMerge}
              >
                {isMerging ? '⚡ Forging...' : '🔥 Forge Equipment'}
              </button>
              {mergeSelection.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={clearMerge}
                  style={{ marginLeft: 12 }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Validation message */}
            {mergeMessage && (
              <div className={`merge-validation ${mergeMessage.type}`}>
                {mergeMessage.text}
              </div>
            )}
            {!mergeMessage && mergeSelection.length > 0 && mergeSelection.length < 3 && (
              <div className="merge-validation info">
                Select {3 - mergeSelection.length} more item{3 - mergeSelection.length > 1 ? 's' : ''} of the same slot &amp; rarity
              </div>
            )}
          </div>

          {/* Inventory for merge selection */}
          <div className="inventory-panel">
            <div className="inventory-header">
              <div>
                <span className="inventory-title">Select Items to Merge</span>
                <span className="inventory-count" style={{ marginLeft: 10 }}>
                  {sortedInventory.length} available
                </span>
              </div>
              <div className="inventory-filters">
                <button
                  type="button"
                  className={`inventory-filter ${slotFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSlotFilter('all')}
                >
                  All
                </button>
                {ALL_SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`inventory-filter ${slotFilter === s ? 'active' : ''}`}
                    onClick={() => setSlotFilter(s)}
                  >
                    {SLOT_ICONS[s]} {s}
                  </button>
                ))}
              </div>
            </div>

            {sortedInventory.length === 0 ? (
              <EmptyState
                title="No Items"
                desc="You need unequipped items to merge. Unequip some gear first."
              />
            ) : (
              <div className="inventory-grid">
                {sortedInventory.map((item) => {
                  const isSelected = mergeSelection.includes(item.id)
                  // Dim items that don't match the first selected item's slot/rarity
                  let dimmed = false
                  if (mergeSelection.length > 0 && !isSelected) {
                    const firstItem = unequipped.find((i) => i.id === mergeSelection[0])
                    if (firstItem) {
                      dimmed =
                        slotKey(item) !== slotKey(firstItem) ||
                        rarityKey(item) !== rarityKey(firstItem)
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className={[
                        'inv-card',
                        `rarity-${rarityKey(item).toLowerCase()}`,
                        isSelected ? 'selected-for-merge' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={dimmed ? { opacity: 0.35, pointerEvents: 'none' } : undefined}
                      onClick={() => toggleMergeSelect(item)}
                      title={isSelected ? 'Click to deselect' : `Select ${item.name} for merge`}
                    >
                      <div className="inv-card-meta">
                        <span className="inv-card-slot">
                          {SLOT_ICONS[slotKey(item)]} {slotKey(item)}
                        </span>
                        <RarityBadge rarity={rarityKey(item)} />
                      </div>
                      <div className="inv-card-name">{item.name}</div>
                      <div className="inv-card-stats">
                        {shortBonuses(item) || `+${totalBonus(item)} total`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
