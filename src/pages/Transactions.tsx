import { MainLayout } from '@/components/layout/MainLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { CreditCard, Banknote, Building2, Package, Receipt } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const paymentConfig = {
  card: { icon: CreditCard, label: '刷卡', className: 'bg-blue-100 text-blue-700' },
  cash: { icon: Banknote, label: '現金', className: 'bg-green-100 text-green-700' },
  transfer: { icon: Building2, label: '轉帳', className: 'bg-purple-100 text-purple-700' },
};

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();

  const totalIncome = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-32 mt-1" />
            </div>
          </div>
          <div className="stat-card">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">交易記錄</h1>
            <p className="text-muted-foreground mt-1">查看所有銷售和服務記錄</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">總收入</p>
            <p className="text-2xl font-bold text-primary">NT${totalIncome.toLocaleString()}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="stat-card">
          {transactions?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>尚無交易記錄</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">交易資訊</TableHead>
                    <TableHead className="font-semibold">商品明細</TableHead>
                    <TableHead className="font-semibold">優惠</TableHead>
                    <TableHead className="font-semibold">支付方式</TableHead>
                    <TableHead className="font-semibold text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => {
                    const payment = paymentConfig[transaction.payment_method];
                    const PaymentIcon = payment.icon;
                    const items = transaction.transaction_items || [];
                    
                    return (
                      <TableRow 
                        key={transaction.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {transaction.members?.name || '非會員'}
                            </p>
                            <p className="text-sm text-muted-foreground">{transaction.transaction_date}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {items.length > 0 ? items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <Package className="w-3 h-3 text-muted-foreground" />
                                <span className="text-foreground">{item.name}</span>
                                <span className="text-muted-foreground">×{item.quantity}</span>
                              </div>
                            )) : (
                              <span className="text-muted-foreground text-sm">無明細</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {Number(transaction.discount) > 0 && (
                              <p className="text-destructive">-NT${Number(transaction.discount).toLocaleString()}</p>
                            )}
                            {Number(transaction.credit_used) > 0 && (
                              <p className="text-primary">購物金: -NT${Number(transaction.credit_used).toLocaleString()}</p>
                            )}
                            {transaction.coupon_used > 0 && (
                              <p className="text-accent">優惠券: -{transaction.coupon_used}張</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${payment.className}`}>
                            <PaymentIcon className="w-3 h-3" />
                            {payment.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-semibold text-foreground">
                              NT${Number(transaction.total).toLocaleString()}
                            </p>
                            {Number(transaction.subtotal) !== Number(transaction.total) && (
                              <p className="text-xs text-muted-foreground line-through">
                                NT${Number(transaction.subtotal).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
