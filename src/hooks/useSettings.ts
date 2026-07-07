import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StoreInfo {
  name: string;
  phone: string;
  address: string;
}

export interface MemberLevelConfig {
  discount: number;
  points_multiplier: number;
  vip_amount: number;
  shopping_credit: number;
}

export interface MemberLevels {
  regular: MemberLevelConfig;
  gold: MemberLevelConfig;
  silver: MemberLevelConfig;
  black: MemberLevelConfig;
}

export interface NotificationSettings {
  low_stock: boolean;
  birthday_reminder: boolean;
  daily_report: boolean;
}

export interface FaqSetting {
  text: string;
}

type SettingsKey = 'store_info' | 'member_levels' | 'notifications' | 'faq';

async function fetchSetting<T>(key: SettingsKey): Promise<T | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching ${key}:`, error);
    return null;
  }

  return (data?.value as T) ?? null;
}

async function updateSetting<T>(key: SettingsKey, value: T): Promise<void> {
  const payload = JSON.parse(JSON.stringify(value));
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value: payload }, { onConflict: 'key' });

  if (error) {
    throw error;
  }
}


export function useStoreInfo() {
  return useQuery({
    queryKey: ['settings', 'store_info'],
    queryFn: () => fetchSetting<StoreInfo>('store_info'),
  });
}

export function useMemberLevels() {
  return useQuery({
    queryKey: ['settings', 'member_levels'],
    queryFn: () => fetchSetting<MemberLevels>('member_levels'),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: () => fetchSetting<NotificationSettings>('notifications'),
  });
}

export function useFaq() {
  return useQuery({
    queryKey: ['settings', 'faq'],
    queryFn: () => fetchSetting<FaqSetting>('faq'),
  });
}

export function useUpdateStoreInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: StoreInfo) => updateSetting('store_info', value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'store_info'] });
      toast.success('店鋪資訊已更新');
    },
    onError: (error) => {
      console.error('Error updating store info:', error);
      toast.error('更新失敗,請確認您有管理員權限');
    },
  });
}

export function useUpdateMemberLevels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: MemberLevels) => updateSetting('member_levels', value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'member_levels'] });
      toast.success('會員等級設定已更新');
    },
    onError: (error) => {
      console.error('Error updating member levels:', error);
      toast.error('更新失敗,請確認您有管理員權限');
    },
  });
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: NotificationSettings) => updateSetting('notifications', value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      toast.success('通知設定已更新');
    },
    onError: (error) => {
      console.error('Error updating notifications:', error);
      toast.error('更新失敗,請確認您有管理員權限');
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (value: FaqSetting) => updateSetting('faq', value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'faq'] });
      toast.success('FAQ 知識庫已更新');
    },
    onError: (error) => {
      console.error('Error updating faq:', error);
      toast.error('更新失敗,請確認您有管理員權限');
    },
  });
}
