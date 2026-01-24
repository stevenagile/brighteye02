import { useState } from 'react';
import { useCreateMember, MemberLevel } from '@/hooks/useMembers';
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

interface AddMemberDialogProps {
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

// 金額格式化輔助函數
const formatAmount = (value: number): string => value.toLocaleString('zh-TW');
const parseAmount = (value: string): number => parseInt(value.replace(/,/g, '')) || 0;

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
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
    address: '',
    occupation: '',
    home_phone: '',
    health_conditions: [] as string[],
    eye_conditions: [] as string[],
    eye_surgeries: [] as string[],
  });

  const createMember = useCreateMember();
  const { data: memberLevels } = useMemberLevels();

  const handleLevelChange = (level: MemberLevel) => {
    const vipAmount = memberLevels?.[level]?.vip_amount ?? 0;
    setFormData({ 
      ...formData, 
      level, 
      vip_amount: vipAmount 
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMember.mutateAsync({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || undefined,
      level: formData.level,
      shopping_credit: formData.shopping_credit,
      coupon_count: formData.coupon_count,
      vip_amount: formData.vip_amount,
      vip_start_date: formData.vip_start_date || undefined,
      notes: formData.notes || undefined,
      gender: formData.gender || undefined,
      birthday: formData.birthday || undefined,
      address: formData.address || undefined,
      occupation: formData.occupation || undefined,
      home_phone: formData.home_phone || undefined,
      health_conditions: formData.health_conditions,
      eye_conditions: formData.eye_conditions,
      eye_surgeries: formData.eye_surgeries,
    });

    setFormData({
      name: '',
      phone: '',
      email: '',
      level: 'regular',
      shopping_credit: 0,
      coupon_count: 0,
      vip_amount: 0,
      vip_start_date: '',
      notes: '',
      gender: '',
      birthday: '',
      address: '',
      occupation: '',
      home_phone: '',
      health_conditions: [],
      eye_conditions: [],
      eye_surgeries: [],
    });
    onOpenChange(false);
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
          <DialogTitle>新增會員</DialogTitle>
          <DialogDescription>
            填寫會員基本資料與健康狀況
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本資料 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">基本資料</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">出生日期</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">職業</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手機 *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home_phone">住家電話</Label>
                  <Input
                    id="home_phone"
                    value={formData.home_phone}
                    onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">住址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* VIP 會員權益 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">VIP 會員權益</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">VIP 等級</Label>
                  <Select
                    value={(formData.level || 'regular') as MemberLevel}
                    onValueChange={(value: MemberLevel) => handleLevelChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="一般客戶" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">一般客戶</SelectItem>
                      <SelectItem value="silver">VIP 銀卡</SelectItem>
                      <SelectItem value="gold">VIP 金卡</SelectItem>
                      <SelectItem value="black">VIP 黑卡</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vip_start_date">入會起始日期</Label>
                  <Input
                    id="vip_start_date"
                    type="date"
                    value={formData.vip_start_date}
                    onChange={(e) => setFormData({ ...formData, vip_start_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vip_amount">VIP 金額</Label>
                  <Input
                    id="vip_amount"
                    type="text"
                    inputMode="numeric"
                    value={formatAmount(formData.vip_amount)}
                    onChange={(e) => setFormData({ ...formData, vip_amount: parseAmount(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopping_credit">購物金</Label>
                  <Input
                    id="shopping_credit"
                    type="text"
                    inputMode="numeric"
                    value={formatAmount(formData.shopping_credit)}
                    onChange={(e) => setFormData({ ...formData, shopping_credit: parseAmount(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon_count">購物券</Label>
                  <Input
                    id="coupon_count"
                    type="number"
                    min="0"
                    value={formData.coupon_count}
                    onChange={(e) => setFormData({ ...formData, coupon_count: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* 病史 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">身體狀況</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HEALTH_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`health-${condition.id}`}
                      checked={formData.health_conditions.includes(condition.label)}
                      onCheckedChange={() => toggleArrayItem('health_conditions', condition.label)}
                    />
                    <Label htmlFor={`health-${condition.id}`} className="text-sm">
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 眼睛狀況 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">眼睛狀況</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EYE_CONDITIONS.map((condition) => (
                  <div key={condition.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`eye-${condition.id}`}
                      checked={formData.eye_conditions.includes(condition.label)}
                      onCheckedChange={() => toggleArrayItem('eye_conditions', condition.label)}
                    />
                    <Label htmlFor={`eye-${condition.id}`} className="text-sm">
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 眼科手術 */}
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">眼科手術史</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EYE_SURGERIES.map((surgery) => (
                  <div key={surgery.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`surgery-${surgery.id}`}
                      checked={formData.eye_surgeries.includes(surgery.label)}
                      onCheckedChange={() => toggleArrayItem('eye_surgeries', surgery.label)}
                    />
                    <Label htmlFor={`surgery-${surgery.id}`} className="text-sm">
                      {surgery.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 備註 */}
            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMember.isPending} 
            className="gradient-primary text-primary-foreground"
          >
            {createMember.isPending ? '新增中...' : '新增會員'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
