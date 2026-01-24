import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type ItemType = 'frame' | 'lens' | 'exam' | 'accessory' | 'other';

export interface TransactionItem {
  id: string;
  transaction_id: string;
  name: string;
  item_type: ItemType;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  member_id: string | null;
  subtotal: number;
  discount: number;
  credit_used: number;
  coupon_used: number;
  total: number;
  payment_method: PaymentMethod;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  members?: {
    id: string;
    name: string;
  } | null;
  transaction_items?: TransactionItem[];
}

export interface CreateTransactionData {
  member_id?: string;
  subtotal: number;
  discount?: number;
  credit_used?: number;
  coupon_used?: number;
  total: number;
  payment_method?: PaymentMethod;
  notes?: string;
  transaction_date?: string;
  items: {
    name: string;
    item_type: ItemType;
    quantity: number;
    price: number;
  }[];
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          members (id, name),
          transaction_items (*)
        `)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, ...transaction }: CreateTransactionData) => {
      // 建立交易
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (txError) throw txError;

      // 建立交易明細
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(items.map(item => ({
            ...item,
            transaction_id: txData.id,
          })));
        
        if (itemsError) throw itemsError;
      }

      return txData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('交易記錄新增成功');
    },
    onError: (error) => {
      toast.error('新增交易失敗：' + error.message);
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('交易記錄刪除成功');
    },
    onError: (error) => {
      toast.error('刪除交易失敗：' + error.message);
    },
  });
}

export function useIncomeStats(period: 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['income-stats', period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('total, transaction_date')
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}
