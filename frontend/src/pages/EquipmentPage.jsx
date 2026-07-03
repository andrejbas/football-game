import { useState } from 'react'
import useSWR from 'swr'
import { Shield, Check } from 'lucide-react'
import { equipmentApi } from '../api/equipment'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'
import { RarityBadge } from '../components/Widgets'

export default function EquipmentPage() {
  const { data: equipmentList, error, mutate } = useSWR('/equipment', () => equipmentApi.list())
  const [loadingId, setLoadingId] = useState(null)
  const [actionError, setActionError] = useState('')

  if (error) return <ErrorState error="Failed to load equipment" />
  if (!equipmentList) return <PageLoading label="Loading Equipment..." />

  const handleToggleEquipment = async (item) => {
    setActionError('')
    setLoadingId(item.id)
    try {
      if (item.is_equipped) {
        await equipmentApi.unequip(item.id)
      } else {
        await equipmentApi.equip(item.id)
      }
      await mutate()
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Unable to update equipment.'))
    } finally {
      setLoadingId(null)
    }
  }

  const formatBonuses = (item) => {
    const bonuses = item.bonuses || {}
    return Object.entries(bonuses)
      .filter(([key, value]) => key !== 'total' && Number(value) > 0)
      .map(([key, value]) => `${key} +${value}`)
      .join(' · ')
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <Shield size={14} />
          Kit &amp; Gear
        </div>
        <h1 className="text-balance">My Equipment</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 520 }}>
          Equip items to boost your effective player stats on the pitch.
        </p>
      </div>

      {actionError ? <div className="alert alert-error" role="alert">{actionError}</div> : null}

      {equipmentList.length === 0 ? (
        <EmptyState title="No Equipment" desc="You don't have any equipment yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipmentList.map((item) => (
            <div key={item.id} className="card flex flex-col justify-between">
              <div className="card-body">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <RarityBadge rarity={item.rarity.toLowerCase()} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="chip capitalize">{item.slot}</span>
                  {item.is_equipped ? (
                    <span className="chip chip-accent"><Check size={12} /> Equipped</span>
                  ) : (
                    <span className="chip">In inventory</span>
                  )}
                </div>

                <div className="info-item mb-4">
                  <div className="info-label">Boosts</div>
                  <div className="info-value text-success" style={{ fontSize: 14 }}>
                    {formatBonuses(item) || `+${item.bonuses?.total ?? 0} total`}
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ paddingTop: 0 }}>
                <button
                  type="button"
                  onClick={() => handleToggleEquipment(item)}
                  disabled={loadingId === item.id}
                  className={`btn btn-block ${item.is_equipped ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {loadingId === item.id ? 'Updating…' : item.is_equipped ? 'Unequip' : 'Equip'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
