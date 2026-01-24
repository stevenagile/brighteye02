import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MemberLevel = 'gold' | 'silver' | 'black';

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  level: MemberLevel;
  shopping_credit: number;
  coupon_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // 新增欄位
  gender: string | null;
  birthday: string | null;
  address: string | null;
  occupation: string | null;
  home_phone: string | null;
  health_conditions: string[];
  eye_conditions: string[];
  eye_surgeries: string[];
}

export interface CreateMemberData {
  name: string;
  phone: string;
  email?: string;
  level?: MemberLevel;
  shopping_credit?: number;
  coupon_count?: number;
  notes?: string;
  gender?: string;
  birthday?: string;
  address?: string;
  occupation?: string;
  home_phone?: string;
  health_conditions?: string[];
  eye_conditions?: string[];
  eye_surgeries?: string[];
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Member | null;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: CreateMemberData) => {
      const { data, error } = await supabase
        .from('members')
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員新增成功');
    },
    onError: (error) => {
      toast.error('新增會員失敗：' + error.message);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Member> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員更新成功');
    },
    onError: (error) => {
      toast.error('更新會員失敗：' + error.message);
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員刪除成功');
    },
    onError: (error) => {
      toast.error('刪除會員失敗：' + error.message);
    },
  });
}
