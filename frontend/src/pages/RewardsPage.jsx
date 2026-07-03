import useSWR from 'swr'
import { Gift } from 'lucide-react'
import { rewardsApi } from '../api/rewards'
import { statusLabel } from '../lib/format'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function RewardsPage() {
  const { data: rewards, error } = useSWR('/rewards', () => rewardsApi.list())

  if (error) return <ErrorState error="Failed to load rewards" />
  if (!rewards) return <PageLoading label="Loading Rewards..." />

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
          {rewards.map((reward) => (
            <div key={reward.id} className="card">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-3">
                  <span className="section-icon"><Gift size={18} /></span>
                  <h3 className="text-lg font-bold">{statusLabel(reward.reward_type)}</h3>
                </div>
                <p className="text-sm text-muted mb-4">{reward.description || 'A valuable reward!'}</p>
                <div className="info-item">
                  <div className="info-label">Amount</div>
                  <div className="info-value text-success">{reward.amount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
