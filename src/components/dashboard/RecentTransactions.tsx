import { usePrescriptions } from '@/hooks/usePrescriptions';
import { useMembers } from '@/hooks/useMembers';
import { Eye, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentTransactions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const { data: members } = useMembers();

  const recentPrescriptions = prescriptions?.slice(0, 5) || [];

  const getMemberName = (memberId: string) => {
    const member = members?.find(m => m.id === memberId);
    return member?.name || '未知會員';
  };

  if (isLoading) {
    return (
      <div className="stat-card">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">最近服務</h3>
          <p className="text-sm text-muted-foreground">最新的驗光服務記錄</p>
        </div>
      </div>

      {recentPrescriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>尚無服務記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentPrescriptions.map((prescription) => {
            return (
              <div 
                key={prescription.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {getMemberName(prescription.member_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {prescription.examiner ? `驗光師：${prescription.examiner}` : '驗光服務'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    NT${Number(prescription.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prescription.exam_date}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
