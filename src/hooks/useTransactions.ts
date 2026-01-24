import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Transaction = Tables<'transactions'>;
export type TransactionItem = Tables<'transaction_items'>;
export type TransactionInsert = TablesInsert<'transactions'>;
export type TransactionItemInsert = TablesInsert<'transaction_items'>;
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type ItemType = 'frame' | 'lens' | 'exam' | 'accessory' | 'other';

export interface TransactionWithRelations extends Transaction {
  members?: {
    id: string;
    name: string;
  } | null;
  prescriptions?: {
    id: string;
    exam_date: string;
  } | null;
  transaction_items?: TransactionItem[];
}

export interface CreateTransactionData {
  member_id?: string;
  prescription_id?: string;
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
          prescriptions (id, exam_date),
          transaction_items (*)
        `)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data as TransactionWithRelations[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, ...transaction }: CreateTransactionData) => {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (txError) throw txError;

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
