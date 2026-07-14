import useSWR from 'swr'
import { Gift, Zap, BatteryCharging, Shirt } from 'lucide-react'
import { rewardsApi } from '../api/rewards'
import { statusLabel, formatDate } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

const TYPE_ICON = {
  xp: Zap,
  energy: BatteryCharging,
  equipment: Shirt,
}

function RewardIcon({ type }) {
  const Icon = TYPE_ICON[type] || Gift
  return <Icon size={18} />
}

/* What actually happened for this reward — one of xp / energy / equipment */
function rewardDetail(reward) {
  if (reward.equipment) {
    return { label: 'Equipment', value: reward.equipment.name }
  }
  if (reward.xp_amount) {
    return { label: 'XP', value: `+${reward.xp_amount}` }
  }
  if (reward.energy_amount) {
    return { label: 'Energy', value: `+${reward.energy_amount}` }
  }
  return { label: 'Amount', value: '—' }
}

function rewardSource(reward) {
  if (reward.match_id) return 'Earned from a match'
  if (reward.game_play_id) return 'Earned from a gameplay session'
  return 'A valuable reward!'
}

export default function RewardsPage() {
  const { data: rewardsPage, error } = useSWR('/rewards', () => rewardsApi.list())

  if (error) return <ErrorState error="Failed to load rewards" />
  if (!rewardsPage) return <PageLoading label="Loading Rewards..." />

  const rewards = rewardsPage.data || rewardsPage

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="pitch-hero">
        <div className="eyebrow flex items-center gap-2">
          <Gift size={14} />
          Trophy Cabinet
        </div>
        <h1 className="text-balance">Rewards</h1>
        <p className="text-secondary text-base" style={{ maxWidth: 520 }}>
          Bonuses and prizes you have earned through matches, training, and the season.
        </p>
      </div>

      {rewards.length === 0 ? (
        <EmptyState title="No Rewards" desc="You haven't earned any rewards yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const detail = rewardDetail(reward)
            return (
              <div key={reward.id} className="card">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="section-icon"><RewardIcon type={reward.type} /></span>
                    <h3 className="text-lg font-bold">{statusLabel(reward.type)} Reward</h3>
                  </div>
                  <p className="text-sm text-muted mb-4">{rewardSource(reward)}</p>
                  <div className="info-item">
                    <div className="info-label">{detail.label}</div>
                    <div className="info-value text-success">{detail.value}</div>
                  </div>
                  {reward.created_at ? (
                    <div className="text-sm text-muted" style={{ marginTop: 8 }}>
                      {formatDate(reward.created_at)}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}