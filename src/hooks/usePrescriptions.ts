import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Prescription = Tables<'prescriptions'>;
export type PrescriptionInsert = TablesInsert<'prescriptions'>;

export interface PrescriptionWithMember extends Prescription {
  members: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          members (id, name, phone)
        `)
        .order('exam_date', { ascending: false });
      
      if (error) throw error;
      return data as PrescriptionWithMember[];
    },
  });
}

export function useMemberPrescriptions(memberId: string) {
  return useQuery({
    queryKey: ['prescriptions', 'member', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('member_id', memberId)
        .order('exam_date', { ascending: false });
      
      if (error) throw error;
      return data as Prescription[];
    },
    enabled: !!memberId,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prescription: PrescriptionInsert) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescription)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('驗光記錄新增成功');
    },
    onError: (error) => {
      toast.error('新增驗光記錄失敗：' + error.message);
    },
  });
}

export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      toast.success('驗光記錄刪除成功');
    },
    onError: (error) => {
      toast.error('刪除驗光記錄失敗：' + error.message);
    },
  });
}
