import useSWR from 'swr'
import { rewardsApi } from '../api/rewards'
import { PageLoading, ErrorState, EmptyState } from '../components/States'

export default function RewardsPage() {
  const { data: rewards, error } = useSWR('/rewards', () => rewardsApi.list())

  if (error) return <ErrorState error="Failed to load rewards" />
  if (!rewards) return <PageLoading label="Loading Rewards..." />

  return (
    <div className="container main-content animate-fade-in">
      <h1 className="mb-6">Rewards</h1>

      {rewards.length === 0 ? (
        <EmptyState title="No Rewards" desc="You haven't earned any rewards yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="glass-panel flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">{reward.reward_type}</h3>
                <p className="text-sm text-muted mb-4">{reward.description || 'A valuable reward!'}</p>
                <div className="text-sm text-primary font-bold">
                  Amount: {reward.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
