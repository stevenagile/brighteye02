import { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Period = 'weekly' | 'monthly';

const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function IncomeChart() {
  const [period, setPeriod] = useState<Period>('weekly');
  const { data: transactions, isLoading } = useTransactions();

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    
    if (period === 'weekly') {
      // 最近 7 天
      const data = weekDays.map((day, i) => ({
        period: day,
        income: 0,
        transactions: 0,
      }));

      transactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 7) {
          const dayIndex = date.getDay();
          data[dayIndex].income += Number(t.total);
          data[dayIndex].transactions += 1;
        }
      });

      return data;
    } else {
      // 今年各月
      const data = months.map((month) => ({
        period: month,
        income: 0,
        transactions: 0,
      }));

      transactions.forEach(t => {
        const date = new Date(t.transaction_date);
        if (date.getFullYear() === now.getFullYear()) {
          const monthIndex = date.getMonth();
          data[monthIndex].income += Number(t.total);
          data[monthIndex].transactions += 1;
        }
      });

      return data;
    }
  }, [transactions, period]);

  const formatCurrency = (value: number) => {
    return `NT$${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="stat-card">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">收入統計</h3>
          <p className="text-sm text-muted-foreground">
            {period === 'weekly' ? '本週收入趨勢' : '年度收入趨勢'}
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setPeriod('weekly')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              period === 'weekly' 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            週報
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              period === 'monthly' 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            月報
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(195 70% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(195 70% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(210 20% 90%)" 
              vertical={false}
            />
            <XAxis 
              dataKey="period" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 50%)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 15% 50%)', fontSize: 12 }}
              tickFormatter={formatCurrency}
              dx={-10}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '收入']}
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(210 20% 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px hsl(215 25% 15% / 0.1)'
              }}
              labelStyle={{ color: 'hsl(215 25% 15%)', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(195 70% 45%)"
              strokeWidth={3}
              fill="url(#incomeGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
