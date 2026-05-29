import { useState, useEffect } from 'react';
import { useUpdateMember, Member, MemberLevel } from '@/hooks/useMembers';
import { useMemberLevels } from '@/hooks/useSettings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { memberUpdateSchema, zodErrorsToMap } from '@/lib/validation';

interface EditMemberDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HEALTH_CONDITIONS = [
  { id: 'diabetes', label: '糖尿病' },
  { id: 'hypertension', label: '高血壓' },
  { id: 'thyroid', label: '甲狀腺疾病' },
  { id: 'pregnancy', label: '懷孕' },
];

const EYE_CONDITIONS = [
  { id: 'glaucoma', label: '青光眼' },
  { id: 'cataract', label: '白內障' },
  { id: 'keratoconus', label: '圓錐角膜' },
  { id: 'eye_injury', label: '眼球受傷' },
  { id: 'keratitis', label: '角膜炎' },
  { id: 'conjunctivitis', label: '結膜炎' },
  { id: 'dry_eye', label: '乾眼症' },
];

const EYE_SURGERIES = [
  { id: 'strabismus', label: '斜弱視' },
  { id: 'cataract_surgery', label: '白內障手術' },
  { id: 'retinal_laser', label: '視網膜雷射手術' },
  { id: 'retinal_detachment', label: '視網膜剝離手術' },
  { id: 'lasik', label: '近視/遠視/散光手術' },
];

const TW_CITIES = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
  '基隆市', '新竹市', '新竹縣', '苗栗縣', '彰化縣', '南投縣',
  '雲林縣', '嘉義市', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '台東縣', '澎湖縣', '金門縣', '連江縣',
];

const formatAmount = (value: number): string => value.toLocaleString('zh-TW');
const parseAmount = (value: string): number => parseInt(value.replace(/,/g, '')) || 0;

export function EditMemberDialog({ member, open, onOpenChange }: EditMemberDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    level: 'regular' as MemberLevel,
    shopping_credit: 0,
    coupon_count: 0,
    vip_amount: 0,
    vip_start_date: '',
    notes: '',
    gender: '',
    birthday: '',
    city: '',
    district: '',
    postal_code: '',
    address: '',
    occupation: '',
    home_phone: '',
    line_id: '',
    referral_source: '',
    health_conditions: [] as string[],
    eye_conditions: [] as string[],
    eye_surgeries: [] as string[],
  });

  const updateMember = useUpdateMember();
  const { data: memberLevels } = useMemberLevels();

  const handleLevelChange = (level: MemberLevel) => {
    const vipAmount = memberLevels?.[level]?.vip_amount ?? formData.vip_amount;
    setFormData({ ...formData, level, vip_amount: vipAmount });
  };

  useEffect(() => {
    if (member) {
      setFormData({
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };
  const errClass = (field: string) =>
    errors[field] ? 'border-destructive focus-visible:ring-destructive' : '';
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      level: formData.level,
      shopping_credit: formData.shopping_credit,
      coupon_count: formData.coupon_count,
      vip_amount: formData.vip_amount,
      vip_start_date: formData.vip_start_date || null,
      notes: formData.notes || null,
      gender: formData.gender || null,
      birthday: formData.birthday || null,
      city: formData.city || null,
      district: formData.district || null,
      postal_code: formData.postal_code || null,
      address: formData.address || null,
      occupation: formData.occupation || null,
      home_phone: formData.home_phone || null,
      line_id: formData.line_id || null,
      referral_source: formData.referral_source || null,
      health_conditions: formData.health_conditions,
      eye_conditions: formData.eye_conditions,
      eye_surgeries: formData.eye_surgeries,
    };

    const parsed = memberUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodErrorsToMap(parsed.error));
      return;
    }
    setErrors({});
    try {
      await updateMember.mutateAsync({ id: member.id, ...payload } as any);
      onOpenChange(false);
    } catch {
      // 後端錯誤 hook 已 toast
    }
  };

  const toggleArrayItem = (
    field: 'health_conditions' | 'eye_conditions' | 'eye_surgeries',
    item: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>編輯客戶</DialogTitle>
          <DialogDescription>修改客戶基本資料、聯絡方式與會員權益</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本資料 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">基本資料</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">姓名 *</Label>
                  <Input id="edit-name" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">性別</Label>
                  <Select value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-birthday">出生日期</Label>
                  <Input id="edit-birthday" type="date" value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-occupation">職業</Label>
                  <Input id="edit-occupation" value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 聯絡方式 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">聯絡方式</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">手機 *</Label>
                  <Input id="edit-phone" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-home_phone">住家電話</Label>
                  <Input id="edit-home_phone" value={formData.home_phone}
                    onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">電子郵件</Label>
                  <Input id="edit-email" type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-line_id">LINE ID</Label>
                  <Input id="edit-line_id" value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 地址 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">地址（選填）</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">縣市</Label>
                  <Select value={formData.city}
                    onValueChange={(value) => setFormData({ ...formData, city: value })}>
                    <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                    <SelectContent>
                      {TW_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-district">鄉鎮市區</Label>
                  <Input id="edit-district" value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-postal_code">郵遞區號</Label>
                  <Input id="edit-postal_code" value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">街道地址</Label>
                <Input id="edit-address" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
            </div>

            {/* VIP 會員權益 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">會員等級與權益</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-level">客戶等級</Label>
                  <Select value={(formData.level || 'regular') as MemberLevel}
                    onValueChange={(value: MemberLevel) => handleLevelChange(value)}>
                    <SelectTrigger><SelectValue placeholder="一般客戶" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">一般客戶</SelectItem>
                      <SelectItem value="silver">VIP 銀卡</SelectItem>
                      <SelectItem value="gold">VIP 金卡</SelectItem>
                      <SelectItem value="black">VIP 黑卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vip_start_date">入會起始日期</Label>
                  <Input id="edit-vip_start_date" type="date" value={formData.vip_start_date}
                    onChange={(e) => setFormData({ ...formData, vip_start_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vip_amount">VIP 金額</Label>
                  <Input id="edit-vip_amount" type="text" inputMode="numeric"
                    value={formatAmount(formData.vip_amount)}
                    onChange={(e) => setFormData({ ...formData, vip_amount: parseAmount(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-shopping_credit">購物金</Label>
                  <Input id="edit-shopping_credit" type="text" inputMode="numeric"
                    value={formatAmount(formData.shopping_credit)}
                    onChange={(e) => setFormData({ ...formData, shopping_credit: parseAmount(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-coupon_count">購物券</Label>
                  <Input id="edit-coupon_count" type="number" min="0" value={formData.coupon_count}
                    onChange={(e) => setFormData({ ...formData, coupon_count: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-referral_source">介紹人 / 來源</Label>
                <Input id="edit-referral_source" value={formData.referral_source}
                  onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })} />
              </div>
            </div>

            {/* 病史 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">身體狀況</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HEALTH_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox id={`edit-health-${condition.id}`}
                      checked={formData.health_conditions.includes(condition.label)}
                      onCheckedChange={() => toggleArrayItem('health_conditions', condition.label)} />
                    <Label htmlFor={`edit-health-${condition.id}`} className="text-sm">{condition.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">眼睛狀況</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EYE_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox id={`edit-eye-${condition.id}`}
                      checked={formData.eye_conditions.includes(condition.label)}
                      onCheckedChange={() => toggleArrayItem('eye_conditions', condition.label)} />
                    <Label htmlFor={`edit-eye-${condition.id}`} className="text-sm">{condition.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">眼科手術史</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EYE_SURGERIES.map((surgery) => (
                  <div key={surgery.id} className="flex items-center space-x-2">
                    <Checkbox id={`edit-surgery-${surgery.id}`}
                      checked={formData.eye_surgeries.includes(surgery.label)}
                      onCheckedChange={() => toggleArrayItem('eye_surgeries', surgery.label)} />
                    <Label htmlFor={`edit-surgery-${surgery.id}`} className="text-sm">{surgery.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">備註</Label>
              <Textarea id="edit-notes" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={updateMember.isPending}
            className="gradient-primary text-primary-foreground">
            {updateMember.isPending ? '儲存中...' : '儲存變更'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
