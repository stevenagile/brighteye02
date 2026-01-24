import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { IncomeChart } from '@/components/dashboard/IncomeChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { MemberLevelStats } from '@/components/dashboard/MemberLevelStats';
import { Users, TrendingUp, Receipt, Eye } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useTransactions } from '@/hooks/useTransactions';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: members, isLoading: membersLoading } = useMembers();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: prescriptions, isLoading: prescriptionsLoading } = usePrescriptions();

  const isLoading = membersLoading || transactionsLoading || prescriptionsLoading;

  const totalMembers = members?.length || 0;
  
  // 計算本週收入
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyTransactions = transactions?.filter(t => 
    new Date(t.transaction_date) >= weekAgo
  ) || [];
  const weeklyIncome = weeklyTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const weeklyCount = weeklyTransactions.length;

  // 計算本週驗光次數
  const weeklyExams = prescriptions?.filter(p => 
    new Date(p.exam_date) >= weekAgo
  ).length || 0;
  
  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">儀表板</h1>
          <p className="text-muted-foreground mt-1">歡迎回到伯洸眼鏡管理系統</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="總會員數"
              value={totalMembers}
              subtitle="活躍會員"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="本週收入"
              value={`NT$${weeklyIncome.toLocaleString()}`}
              subtitle={`共 ${weeklyCount} 筆交易`}
              icon={TrendingUp}
              variant="accent"
            />
            <StatCard
              title="本週交易"
              value={weeklyCount}
              subtitle="筆交易"
              icon={Receipt}
            />
            <StatCard
              title="本週驗光"
              value={weeklyExams}
              subtitle="次服務"
              icon={Eye}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IncomeChart />
          </div>
          <div>
            <MemberLevelStats />
          </div>
        </div>

        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </MainLayout>
  );
}
