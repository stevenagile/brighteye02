import { useTransactions } from '@/hooks/useTransactions';
import { CreditCard, Banknote, Building2, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const paymentIcons = {
  card: CreditCard,
  cash: Banknote,
  transfer: Building2,
};

const paymentLabels = {
  card: '刷卡',
  cash: '現金',
  transfer: '轉帳',
};

export function RecentTransactions() {
  const { data: transactions, isLoading } = useTransactions();

  const recentTransactions = transactions?.slice(0, 5) || [];

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
          <h3 className="text-lg font-semibold text-foreground">最近交易</h3>
          <p className="text-sm text-muted-foreground">最新的銷售記錄</p>
        </div>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>尚無交易記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentTransactions.map((transaction) => {
            const PaymentIcon = paymentIcons[transaction.payment_method];
            const items = transaction.transaction_items || [];
            return (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                    <PaymentIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.members?.name || '非會員'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {items.length > 0 
                        ? items.map(i => i.name).join('、')
                        : '無明細'
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    NT${Number(transaction.total).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {paymentLabels[transaction.payment_method]} · {transaction.transaction_date}
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
