import { useState, useEffect } from 'react';
import { useCreatePrescription, PrescriptionInsert } from '@/hooks/usePrescriptions';
import { useMembers, useUpdateMember, Member } from '@/hooks/useMembers';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MemberBadge } from '@/components/members/MemberBadge';
import { Wallet } from 'lucide-react';

interface AddPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPrescriptionDialog({ open, onOpenChange }: AddPrescriptionDialogProps) {
  const { data: members } = useMembers();
  const createPrescription = useCreatePrescription();
  const updateMember = useUpdateMember();

  const [formData, setFormData] = useState({
    member_id: '',
    exam_date: new Date().toISOString().split('T')[0],
    service_type: '驗光',
    // 右眼
    right_sc: '',
    right_cc: '',
    right_best_s: '',
    right_best_c: '',
    right_best_a: '',
    right_auto_s: '',
    right_auto_c: '',
    right_auto_a: '',
    right_old_s: '',
    right_old_c: '',
    right_old_a: '',
    right_old_va: '',
    right_old_year: '',
    right_add: '',
    right_pd: '',
    // 左眼
    left_sc: '',
    left_cc: '',
    left_best_s: '',
    left_best_c: '',
    left_best_a: '',
    left_auto_s: '',
    left_auto_c: '',
    left_auto_a: '',
    left_old_s: '',
    left_old_c: '',
    left_old_a: '',
    left_old_va: '',
    left_old_year: '',
    left_add: '',
    left_pd: '',
    // 其他
    amount: '',
    credit_used: '',
    examiner: '',
    notes: '',
  });

  // 選中的會員
  const selectedMember = members?.find(m => m.id === formData.member_id) || null;
  const availableCredit = Number(selectedMember?.shopping_credit || 0);
  const creditUsed = Number(formData.credit_used || 0);
  const creditRemaining = availableCredit - creditUsed;

  // 當會員變更時，重置購物金折抵
  useEffect(() => {
    setFormData(prev => ({ ...prev, credit_used: '' }));
  }, [formData.member_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCreditUsed = Math.min(creditUsed, availableCredit);
    const finalCreditRemaining = availableCredit - finalCreditUsed;

    const prescription: PrescriptionInsert = {
      member_id: formData.member_id,
      exam_date: formData.exam_date,
      service_type: formData.service_type,
      right_sc: formData.right_sc || null,
      right_cc: formData.right_cc || null,
      right_best_s: formData.right_best_s ? Number(formData.right_best_s) : null,
      right_best_c: formData.right_best_c ? Number(formData.right_best_c) : null,
      right_best_a: formData.right_best_a ? Number(formData.right_best_a) : null,
      right_auto_s: formData.right_auto_s ? Number(formData.right_auto_s) : null,
      right_auto_c: formData.right_auto_c ? Number(formData.right_auto_c) : null,
      right_auto_a: formData.right_auto_a ? Number(formData.right_auto_a) : null,
      right_old_s: formData.right_old_s ? Number(formData.right_old_s) : null,
      right_old_c: formData.right_old_c ? Number(formData.right_old_c) : null,
      right_old_a: formData.right_old_a ? Number(formData.right_old_a) : null,
      right_old_va: formData.right_old_va || null,
      right_old_year: formData.right_old_year ? Number(formData.right_old_year) : null,
      right_add: formData.right_add ? Number(formData.right_add) : null,
      right_pd: formData.right_pd ? Number(formData.right_pd) : null,
      left_sc: formData.left_sc || null,
      left_cc: formData.left_cc || null,
      left_best_s: formData.left_best_s ? Number(formData.left_best_s) : null,
      left_best_c: formData.left_best_c ? Number(formData.left_best_c) : null,
      left_best_a: formData.left_best_a ? Number(formData.left_best_a) : null,
      left_auto_s: formData.left_auto_s ? Number(formData.left_auto_s) : null,
      left_auto_c: formData.left_auto_c ? Number(formData.left_auto_c) : null,
      left_auto_a: formData.left_auto_a ? Number(formData.left_auto_a) : null,
      left_old_s: formData.left_old_s ? Number(formData.left_old_s) : null,
      left_old_c: formData.left_old_c ? Number(formData.left_old_c) : null,
      left_old_a: formData.left_old_a ? Number(formData.left_old_a) : null,
      left_old_va: formData.left_old_va || null,
      left_old_year: formData.left_old_year ? Number(formData.left_old_year) : null,
      left_add: formData.left_add ? Number(formData.left_add) : null,
      left_pd: formData.left_pd ? Number(formData.left_pd) : null,
      amount: formData.amount ? Number(formData.amount) : null,
      credit_used: finalCreditUsed,
      credit_remaining: finalCreditRemaining,
      examiner: formData.examiner || null,
      notes: formData.notes || null,
    };

    await createPrescription.mutateAsync(prescription);

    // 同步更新會員購物金餘額
    if (selectedMember && finalCreditUsed > 0) {
      await updateMember.mutateAsync({
        id: selectedMember.id,
        shopping_credit: finalCreditRemaining,
      });
    }

    // Reset form
    setFormData({
      member_id: '',
      exam_date: new Date().toISOString().split('T')[0],
      service_type: '驗光',
      right_sc: '',
      right_cc: '',
      right_best_s: '',
      right_best_c: '',
      right_best_a: '',
      right_auto_s: '',
      right_auto_c: '',
      right_auto_a: '',
      right_old_s: '',
      right_old_c: '',
      right_old_a: '',
      right_old_va: '',
      right_old_year: '',
      right_add: '',
      right_pd: '',
      left_sc: '',
      left_cc: '',
      left_best_s: '',
      left_best_c: '',
      left_best_a: '',
      left_auto_s: '',
      left_auto_c: '',
      left_auto_a: '',
      left_old_s: '',
      left_old_c: '',
      left_old_a: '',
      left_old_va: '',
      left_old_year: '',
      left_add: '',
      left_pd: '',
      amount: '',
      credit_used: '',
      examiner: '',
      notes: '',
    });
    onOpenChange(false);
  };

  const formatDecimal2 = (key: string) => {
    const val = (formData as any)[key];
    if (val === '' || val == null) return;
    const n = Number(val);
    if (!isNaN(n)) setFormData({ ...formData, [key]: n.toFixed(2) });
  };

  const EyeSection = ({ prefix }: { prefix: 'right' | 'left' }) => (
    <div className="space-y-4">
      {/* 視力 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">SC 裸視</Label>
          <Input
            placeholder="0.5"
            value={(formData as any)[`${prefix}_sc`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_sc`]: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">CC 最佳視力</Label>
          <Input
            placeholder="1.0"
            value={(formData as any)[`${prefix}_cc`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_cc`]: e.target.value })}
          />
        </div>
      </div>

      {/* 最佳矯正度數 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">最佳矯正度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <Input
              type="number"
              step="0.25"
              placeholder="-2.50"
              value={(formData as any)[`${prefix}_best_s`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_s`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_best_s`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              placeholder="-0.50"
              value={(formData as any)[`${prefix}_best_c`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_c`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_best_c`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              placeholder="180"
              value={(formData as any)[`${prefix}_best_a`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_a`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_best_a`)}
            />
          </div>
        </div>
      </div>

      {/* 電腦驗光度數 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">電腦驗光度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_auto_s`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_s`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_auto_s`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_auto_c`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_c`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_auto_c`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              value={(formData as any)[`${prefix}_auto_a`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_a`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_auto_a`)}
            />
          </div>
        </div>
      </div>

      {/* 原戴眼鏡度數 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">原戴眼鏡度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_old_s`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_s`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_old_s`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_old_c`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_c`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_old_c`)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              value={(formData as any)[`${prefix}_old_a`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_a`]: e.target.value })}
              onBlur={() => formatDecimal2(`${prefix}_old_a`)}
            />
          </div>
        </div>
      </div>

      {/* 原眼鏡視力/配戴期 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">原眼鏡視力</Label>
          <Input
            placeholder="0.8"
            value={(formData as any)[`${prefix}_old_va`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_old_va`]: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">配戴期 (年)</Label>
          <Input
            type="number"
            min="0"
            placeholder="2"
            value={(formData as any)[`${prefix}_old_year`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_old_year`]: e.target.value })}
          />
        </div>
      </div>

      {/* ADD / PD */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">ADD (老花度數)</Label>
          <Input
            type="number"
            step="0.25"
            placeholder="2.00"
            value={(formData as any)[`${prefix}_add`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_add`]: e.target.value })}
            onBlur={() => formatDecimal2(`${prefix}_add`)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">PD (瞳距 mm)</Label>
          <Input
            type="number"
            step="0.5"
            placeholder="32"
            value={(formData as any)[`${prefix}_pd`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_pd`]: e.target.value })}
            onBlur={() => formatDecimal2(`${prefix}_pd`)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>新增驗光記錄</DialogTitle>
          <DialogDescription>
            填寫完整的驗光處方資料
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="member">會員 *</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇會員" />
                  </SelectTrigger>
                  <SelectContent>
                    {members?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_date">檢查日期</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </div>
            </div>

            {/* 會員等級與購物金資訊 */}
            {selectedMember && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">會員等級：</span>
                    <MemberBadge level={selectedMember.level} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">購物金餘額：</span>
                    <span className="font-semibold text-primary">NT${availableCredit.toLocaleString()}</span>
                  </div>
                </div>

                {availableCredit > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="credit_used">本次折抵購物金</Label>
                      <span className="text-xs text-muted-foreground">
                        折抵後剩餘: NT${creditRemaining >= 0 ? creditRemaining.toLocaleString() : 0}
                      </span>
                    </div>
                    <Input
                      id="credit_used"
                      type="number"
                      min="0"
                      max={availableCredit}
                      placeholder={`最多可折抵 ${availableCredit}`}
                      value={formData.credit_used}
                      onChange={(e) => {
                        const value = Math.min(Number(e.target.value), availableCredit);
                        setFormData({ ...formData, credit_used: value > 0 ? String(value) : e.target.value });
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 服務項目 */}
            <div className="space-y-2">
              <Label>服務項目</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇服務項目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="驗光">驗光</SelectItem>
                  <SelectItem value="配鏡">配鏡</SelectItem>
                  <SelectItem value="鏡架">鏡架</SelectItem>
                  <SelectItem value="維護">維護</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 左右眼 Tabs */}
            <Tabs defaultValue="right" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="right">右眼 (OD)</TabsTrigger>
                <TabsTrigger value="left">左眼 (OS)</TabsTrigger>
              </TabsList>
              <TabsContent value="right" className="mt-4">
                <EyeSection prefix="right" />
              </TabsContent>
              <TabsContent value="left" className="mt-4">
                <EyeSection prefix="left" />
              </TabsContent>
            </Tabs>

            {/* 其他資訊 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">金額</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    placeholder="8000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examiner">檢查人員</Label>
                  <Input
                    id="examiner"
                    placeholder="驗光師姓名"
                    value={formData.examiner}
                    onChange={(e) => setFormData({ ...formData, examiner: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="如：度數穩定、建議配戴時間等"
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createPrescription.isPending || !formData.member_id} 
            className="gradient-primary text-primary-foreground"
          >
            {createPrescription.isPending ? '新增中...' : '新增記錄'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
