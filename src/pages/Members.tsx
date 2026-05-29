import { MainLayout } from '@/components/layout/MainLayout';
import { MemberTable } from '@/components/members/MemberTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { Users, Crown, Medal, Star, Plus, User } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddMemberDialog } from '@/components/members/AddMemberDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Members() {
  const { data: members, isLoading } = useMembers();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const regularCount = members?.filter(m => m.level === 'regular').length || 0;
  const goldCount = members?.filter(m => m.level === 'gold').length || 0;
  const silverCount = members?.filter(m => m.level === 'silver').length || 0;
  const blackCount = members?.filter(m => m.level === 'black').length || 0;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">客戶管理</h1>
            <p className="text-muted-foreground mt-1">管理客戶資訊、等級、權益與服務紀錄</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            新增客戶
          </Button>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <StatCard
              title="總客戶數"
              value={(members?.length || 0).toLocaleString()}
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="一般客戶"
              value={regularCount.toLocaleString()}
              icon={User}
            />
            <StatCard
              title="VIP 銀卡"
              value={silverCount.toLocaleString()}
              icon={Medal}
            />
            <StatCard
              title="VIP 金卡"
              value={goldCount.toLocaleString()}
              icon={Crown}
              variant="accent"
            />
            <StatCard
              title="VIP 黑卡"
              value={blackCount.toLocaleString()}
              icon={Star}
            />
          </div>
        )}

        {/* Member Table */}
        <MemberTable />

        {/* Add Member Dialog */}
        <AddMemberDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </MainLayout>
  );
}
