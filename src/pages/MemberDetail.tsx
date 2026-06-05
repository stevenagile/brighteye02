import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { MemberBadge } from '@/components/members/MemberBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Pencil, Save, X, Trash2, Phone, Mail, MapPin, Calendar,
  Briefcase, MessageCircle, UserPlus, CreditCard, Wallet, TrendingDown,
  Receipt, AlertCircle, Loader2, ChevronRight, Plus,
} from 'lucide-react';
import { useMember, useUpdateMember, useDeleteMember, MemberLevel } from '@/hooks/useMembers';
import { useMemberLevels } from '@/hooks/useSettings';
import { EditPrescriptionDialog } from '@/components/prescriptions/EditPrescriptionDialog';
import { AddPrescriptionDialog } from '@/components/prescriptions/AddPrescriptionDialog';
import type { Prescription } from '@/hooks/usePrescriptions';
import { cn } from '@/lib/utils';
import { memberUpdateSchema, zodErrorsToMap } from '@/lib/validation';

const HEALTH_CONDITIONS = ['糖尿病', '高血壓', '甲狀腺疾病', '懷孕'];
const EYE_CONDITIONS = ['青光眼', '白內障', '圓錐角膜', '眼球受傷', '角膜炎', '結膜炎', '乾眼症'];
const EYE_SURGERIES = ['斜弱視', '白內障手術', '視網膜雷射手術', '視網膜剝離手術', '近視/遠視/散光手術'];
const TW_CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
  '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
];

const formatAmount = (n: number) => (n || 0).toLocaleString('zh-TW');
const parseAmount = (s: string) => parseInt(s.replace(/,/g, '')) || 0;

import { calculateAge } from '@/lib/age';


export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: member, isLoading } = useMember(id!);
  const { data: memberLevels } = useMemberLevels();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [addRecordOpen, setAddRecordOpen] = useState(false);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };
  const errClass = (f: string) =>
    errors[f] ? 'border-destructive focus-visible:ring-destructive' : '';

  const { data: serviceRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['member-service-records', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('member_id', id!)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        level: member.level as MemberLevel,
        shopping_credit: Number(member.shopping_credit) || 0,
        coupon_count: member.coupon_count || 0,
        vip_amount: Number(member.vip_amount) || 0,
        vip_start_date: member.vip_start_date || '',
        notes: member.notes || '',
        gender: member.gender || '',
        birthday: member.birthday || '',
        city: (member as any).city || '',
        district: (member as any).district || '',
        postal_code: (member as any).postal_code || '',
        address: member.address || '',
        occupation: member.occupation || '',
        home_phone: member.home_phone || '',
        line_id: (member as any).line_id || '',
        referral_source: (member as any).referral_source || '',
        health_conditions: member.health_conditions || [],
        eye_conditions: member.eye_conditions || [],
        eye_surgeries: member.eye_surgeries || [],
      });
    }
  }, [member]);

  const creditUsed = useMemo(
    () => (serviceRecords || []).reduce((sum, r: any) => sum + Number(r.credit_used || 0), 0),
    [serviceRecords]
  );
  const remaining = Number(member?.shopping_credit || 0) - creditUsed;
  const age = calculateAge(member?.birthday || null);
  const address = member
    ? [(member as any).postal_code, (member as any).city, (member as any).district, member.address]
        .filter(Boolean).join(' ')
    : '';

  if (isLoading || !member || !form) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  const handleLevelChange = (level: MemberLevel) => {
    const vipAmount = memberLevels?.[level]?.vip_amount ?? form.vip_amount;
    setForm({ ...form, level, vip_amount: vipAmount });
  };

  const toggleArr = (field: 'health_conditions' | 'eye_conditions' | 'eye_surgeries', item: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i: string) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      level: form.level,
      shopping_credit: form.shopping_credit,
      coupon_count: form.coupon_count,
      vip_amount: form.vip_amount,
      vip_start_date: form.vip_start_date || null,
      notes: form.notes || null,
      gender: form.gender || null,
      birthday: form.birthday || null,
      city: form.city || null,
      district: form.district || null,
      postal_code: form.postal_code || null,
      address: form.address || null,
      occupation: form.occupation || null,
      home_phone: form.home_phone || null,
      line_id: form.line_id || null,
      referral_source: form.referral_source || null,
      health_conditions: form.health_conditions,
      eye_conditions: form.eye_conditions,
      eye_surgeries: form.eye_surgeries,
    };
    const parsed = memberUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodErrorsToMap(parsed.error));
      return;
    }
    setErrors({});
    try {
      await updateMember.mutateAsync({ id: member.id, ...payload } as any);
      setEditing(false);
    } catch {
      // 後端錯誤已在 hook 以 toast 顯示
    }
  };

  const handleDelete = async () => {
    await deleteMember.mutateAsync(member.id);
    navigate('/members');
  };

  const ro = !editing;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/members')}>
              <ArrowLeft className="w-4 h-4 mr-1" />返回客戶列表
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => { setEditing(false); }} disabled={updateMember.isPending}>
                  <X className="w-4 h-4 mr-1" />取消
                </Button>
                <Button onClick={handleSave} disabled={updateMember.isPending}
                  className="gradient-primary text-primary-foreground">
                  {updateMember.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  儲存變更
                </Button>
              </>
            ) : (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-1" />刪除客戶
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除客戶？</AlertDialogTitle>
                      <AlertDialogDescription>
                        此動作將永久刪除「{member.name}」的所有客戶資料，無法復原。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        確認刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={() => setEditing(true)} className="gradient-primary text-primary-foreground">
                  <Pencil className="w-4 h-4 mr-1" />編輯
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="stat-card">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">{member.name}</h1>
                {member.gender && <span className="text-muted-foreground">（{member.gender}）</span>}
                <span className="text-muted-foreground">{age !== null ? `${age} 歲` : '—'}</span>
                <MemberBadge level={member.level as MemberLevel} />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{member.phone}</span>
                {member.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{member.email}</span>}
                {address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{address}</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 min-w-[360px]">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" />VIP 金額</div>
                <div className="text-xl font-bold text-accent">NT${formatAmount(Number(member.vip_amount || 0))}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" />已折抵</div>
                <div className="text-xl font-bold text-destructive">NT${formatAmount(creditUsed)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" />剩餘購物金</div>
                <div className="text-xl font-bold text-primary">NT${formatAmount(remaining)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本資料</TabsTrigger>
            <TabsTrigger value="benefits">會員權益</TabsTrigger>
            <TabsTrigger value="health">健康狀況</TabsTrigger>
            <TabsTrigger value="records">服務紀錄 {serviceRecords?.length ? `(${serviceRecords.length})` : ''}</TabsTrigger>
          </TabsList>

          {/* 基本資料 */}
          <TabsContent value="basic" className="space-y-6">
            <Section title="基本資料">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="姓名 *" error={errors.name}>
                  <Input readOnly={ro} value={form.name} className={cn(errClass('name'))}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); clearError('name'); }} />
                </Field>
                <Field label="性別">
                  <Select disabled={ro} value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="出生日期">
                  <Input type="date" readOnly={ro} value={form.birthday}
                    onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
                </Field>
                <Field label="職業">
                  <Input readOnly={ro} value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section title="聯絡方式">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="手機 *" error={errors.phone}>
                  <Input readOnly={ro} value={form.phone} className={cn(errClass('phone'))}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearError('phone'); }} />
                </Field>
                <Field label="住家電話" error={errors.home_phone}>
                  <Input readOnly={ro} value={form.home_phone} className={cn(errClass('home_phone'))}
                    onChange={(e) => { setForm({ ...form, home_phone: e.target.value }); clearError('home_phone'); }} />
                </Field>
                <Field label="電子郵件" error={errors.email}>
                  <Input type="email" readOnly={ro} value={form.email} className={cn(errClass('email'))}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); clearError('email'); }} />
                </Field>
                <Field label="LINE ID">
                  <Input readOnly={ro} value={form.line_id}
                    onChange={(e) => setForm({ ...form, line_id: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section title="地址（選填）">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="縣市">
                  <Select disabled={ro} value={form.city}
                    onValueChange={(v) => setForm({ ...form, city: v })}>
                    <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      {TW_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="鄉鎮市區">
                  <Input readOnly={ro} value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </Field>
                <Field label="郵遞區號">
                  <Input readOnly={ro} value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
                </Field>
              </div>
              <Field label="街道地址">
                <Input readOnly={ro} value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </Section>

            <Section title="備註">
              <Textarea readOnly={ro} value={form.notes} rows={4}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Section>
          </TabsContent>

          {/* 會員權益 */}
          <TabsContent value="benefits" className="space-y-6">
            <Section title="會員等級與權益">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="客戶等級">
                  <Select disabled={ro} value={form.level}
                    onValueChange={(v: MemberLevel) => handleLevelChange(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">一般客戶</SelectItem>
                      <SelectItem value="silver">VIP 銀卡</SelectItem>
                      <SelectItem value="gold">VIP 金卡</SelectItem>
                      <SelectItem value="black">VIP 黑卡</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="入會起始日期">
                  <Input type="date" readOnly={ro} value={form.vip_start_date}
                    onChange={(e) => setForm({ ...form, vip_start_date: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="VIP 金額">
                  <Input readOnly={ro} inputMode="numeric"
                    value={formatAmount(form.vip_amount)}
                    onChange={(e) => setForm({ ...form, vip_amount: parseAmount(e.target.value) })} />
                </Field>
                <Field label="購物金">
                  <Input readOnly={ro} inputMode="numeric"
                    value={formatAmount(form.shopping_credit)}
                    onChange={(e) => setForm({ ...form, shopping_credit: parseAmount(e.target.value) })} />
                </Field>
                <Field label="購物券">
                  <Input readOnly={ro} type="number" min="0" value={form.coupon_count}
                    onChange={(e) => setForm({ ...form, coupon_count: Number(e.target.value) })} />
                </Field>
              </div>
              <Field label="介紹人 / 來源">
                <Input readOnly={ro} value={form.referral_source}
                  onChange={(e) => setForm({ ...form, referral_source: e.target.value })} />
              </Field>
            </Section>
          </TabsContent>

          {/* 健康狀況 */}
          <TabsContent value="health" className="space-y-6">
            <Section title="身體狀況">
              <CheckGrid options={HEALTH_CONDITIONS} values={form.health_conditions}
                disabled={ro} onToggle={(v) => toggleArr('health_conditions', v)} cols={4} />
            </Section>
            <Section title="眼睛狀況">
              <CheckGrid options={EYE_CONDITIONS} values={form.eye_conditions}
                disabled={ro} onToggle={(v) => toggleArr('eye_conditions', v)} cols={4} />
            </Section>
            <Section title="眼科手術史">
              <CheckGrid options={EYE_SURGERIES} values={form.eye_surgeries}
                disabled={ro} onToggle={(v) => toggleArr('eye_surgeries', v)} cols={3} />
            </Section>
          </TabsContent>

          {/* 服務紀錄 */}
          <TabsContent value="records">
            <Section
              title="客戶服務紀錄"
              icon={<Receipt className="w-4 h-4" />}
              action={
                <Button size="sm" onClick={() => setAddRecordOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />新增服務紀錄
                </Button>
              }
            >
              {loadingRecords ? (
                <p className="text-sm text-muted-foreground">載入中…</p>
              ) : serviceRecords?.length ? (
                <div className="space-y-2">
                  {serviceRecords.map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setViewPrescription(p as Prescription)}
                      className="w-full text-left rounded-lg border border-border bg-card/50 p-4 space-y-2 hover:bg-muted/50 hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {new Date(p.exam_date).toLocaleDateString('zh-TW')}
                          </span>
                          <Badge variant="outline" className="text-xs">{p.service_type || '驗光'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            NT${formatAmount(Number(p.amount || 0))}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
                        <span>驗光師：{p.examiner || '—'}</span>
                        {Number(p.credit_used || 0) > 0 && (
                          <span className="text-destructive">
                            折抵購物金：NT${formatAmount(Number(p.credit_used))}
                          </span>
                        )}
                      </div>
                      {p.notes && (
                        <p className="text-sm text-muted-foreground pt-2 border-t border-border/40 whitespace-pre-wrap">
                          {p.notes}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>尚無服務紀錄</p>
                </div>
              )}
            </Section>
          </TabsContent>
        </Tabs>
      </div>

      <EditPrescriptionDialog
        open={!!viewPrescription}
        onOpenChange={(o) => !o && setViewPrescription(null)}
        prescription={viewPrescription}
      />
    </MainLayout>
  );
}

function Section({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="stat-card space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          {icon}{title}
        </h3>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label, children, error,
}: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CheckGrid({
  options, values, disabled, onToggle, cols,
}: { options: string[]; values: string[]; disabled: boolean; onToggle: (v: string) => void; cols: number }) {
  const gridClass = cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
  return (
    <div className={`grid ${gridClass} gap-3`}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={values.includes(opt)} disabled={disabled}
            onCheckedChange={() => onToggle(opt)} />
          <span className={disabled && !values.includes(opt) ? 'text-muted-foreground' : ''}>{opt}</span>
        </label>
      ))}
    </div>
  );
}
