import { useState } from 'react'
import useSWR from 'swr'
import { equipmentApi } from '../api/equipment'
import { apiErrorMessage } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

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
      .map(([key, value]) => `${key}: +${value}`)
      .join(' • ')
  }

  return (
    <div className="container main-content animate-fade-in">
      <div className="mb-6">
        <h1 className="mb-2">My Equipment</h1>
        <p className="text-muted text-sm">Equip items to boost your effective player stats.</p>
      </div>

      {actionError ? (
        <div className="alert alert-error mb-6" role="alert">
          {actionError}
        </div>
      ) : null}

      {equipmentList.length === 0 ? (
        <EmptyState title="No Equipment" desc="You don't have any equipment yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {equipmentList.map((item) => (
            <div key={item.id} className="glass-panel flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <span className={`badge rarity-badge-${item.rarity.toLowerCase()}`}>{item.rarity}</span>
                </div>
                <p className="text-sm text-muted mb-4 capitalize">Slot: {item.slot}</p>
                <div className="text-sm mb-4">
                  Boosts:<br/>
                  <span className="text-success">{formatBonuses(item) || `+${item.bonuses?.total ?? 0} total`}</span>
                </div>
                <p className="text-xs text-muted">{item.is_equipped ? 'Currently equipped' : 'In inventory'}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleEquipment(item)}
                disabled={loadingId === item.id}
                className="w-full py-2 rounded text-sm font-semibold transition-colors mt-2 border border-primary text-primary hover:bg-primary hover:text-white"
              >
                {loadingId === item.id ? 'Updating…' : item.is_equipped ? 'Unequip' : 'Equip'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
