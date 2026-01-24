import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Prescription {
  id: string;
  member_id: string;
  exam_date: string;
  
  // 右眼
  right_sc_naked: string | null;
  right_cc_best: string | null;
  right_best_sphere: number | null;
  right_best_cylinder: number | null;
  right_best_axis: number | null;
  right_auto_sphere: number | null;
  right_auto_cylinder: number | null;
  right_auto_axis: number | null;
  right_old_sphere: number | null;
  right_old_cylinder: number | null;
  right_old_axis: number | null;
  right_old_vision: string | null;
  right_old_years: number | null;
  right_add: number | null;
  right_pd: number | null;
  
  // 左眼
  left_sc_naked: string | null;
  left_cc_best: string | null;
  left_best_sphere: number | null;
  left_best_cylinder: number | null;
  left_best_axis: number | null;
  left_auto_sphere: number | null;
  left_auto_cylinder: number | null;
  left_auto_axis: number | null;
  left_old_sphere: number | null;
  left_old_cylinder: number | null;
  left_old_axis: number | null;
  left_old_vision: string | null;
  left_old_years: number | null;
  left_add: number | null;
  left_pd: number | null;
  
  // 其他
  amount: number | null;
  examiner: string | null;
  notes: string | null;
  created_at: string;
}

export interface PrescriptionWithMember extends Prescription {
  members: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export interface CreatePrescriptionData {
  member_id: string;
  exam_date?: string;
  
  right_sc_naked?: string;
  right_cc_best?: string;
  right_best_sphere?: number;
  right_best_cylinder?: number;
  right_best_axis?: number;
  right_auto_sphere?: number;
  right_auto_cylinder?: number;
  right_auto_axis?: number;
  right_old_sphere?: number;
  right_old_cylinder?: number;
  right_old_axis?: number;
  right_old_vision?: string;
  right_old_years?: number;
  right_add?: number;
  right_pd?: number;
  
  left_sc_naked?: string;
  left_cc_best?: string;
  left_best_sphere?: number;
  left_best_cylinder?: number;
  left_best_axis?: number;
  left_auto_sphere?: number;
  left_auto_cylinder?: number;
  left_auto_axis?: number;
  left_old_sphere?: number;
  left_old_cylinder?: number;
  left_old_axis?: number;
  left_old_vision?: string;
  left_old_years?: number;
  left_add?: number;
  left_pd?: number;
  
  amount?: number;
  examiner?: string;
  notes?: string;
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
    mutationFn: async (prescription: CreatePrescriptionData) => {
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
