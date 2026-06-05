import { useState, useEffect } from 'react';
import { DecimalInput } from '@/components/prescriptions/DecimalInput';
import { useUpdatePrescription, Prescription } from '@/hooks/usePrescriptions';
import { useTransactions } from '@/hooks/useTransactions';
import { useMembers, useUpdateMember } from '@/hooks/useMembers';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link2, Wallet } from 'lucide-react';
import { MemberBadge } from '@/components/members/MemberBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
}

export function EditPrescriptionDialog({ open, onOpenChange, prescription }: EditPrescriptionDialogProps) {
  const updatePrescription = useUpdatePrescription();
  const updateMember = useUpdateMember();
  const { data: transactions } = useTransactions();
  const { data: members } = useMembers();

  const [formData, setFormData] = useState({
    exam_date: '',
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

  // 找到關聯的交易記錄和會員資訊
  const linkedTransaction = transactions?.find(t => t.prescription_id === prescription?.id);
  const prescriptionMember = members?.find(m => m.id === prescription?.member_id) || null;

  // 計算可用購物金：會員當前餘額 + 原本已折抵的金額
  const originalCreditUsed = Number((prescription as any)?.credit_used || 0);
  const memberCurrentCredit = Number(prescriptionMember?.shopping_credit || 0);
  const totalAvailableCredit = memberCurrentCredit + originalCreditUsed;
  const newCreditUsed = Number(formData.credit_used || 0);
  const creditDifference = newCreditUsed - originalCreditUsed;
  const creditRemaining = totalAvailableCredit - newCreditUsed;

  useEffect(() => {
    if (prescription) {
      setFormData({
        exam_date: prescription.exam_date || '',
        service_type: (prescription as any).service_type || '驗光',
        right_sc: prescription.right_sc || '',
        right_cc: prescription.right_cc || '',
        right_best_s: prescription.right_best_s?.toString() || '',
        right_best_c: prescription.right_best_c?.toString() || '',
        right_best_a: prescription.right_best_a?.toString() || '',
        right_auto_s: prescription.right_auto_s?.toString() || '',
        right_auto_c: prescription.right_auto_c?.toString() || '',
        right_auto_a: prescription.right_auto_a?.toString() || '',
        right_old_s: prescription.right_old_s?.toString() || '',
        right_old_c: prescription.right_old_c?.toString() || '',
        right_old_a: prescription.right_old_a?.toString() || '',
        right_old_va: prescription.right_old_va || '',
        right_old_year: prescription.right_old_year?.toString() || '',
        right_add: prescription.right_add?.toString() || '',
        right_pd: prescription.right_pd?.toString() || '',
        left_sc: prescription.left_sc || '',
        left_cc: prescription.left_cc || '',
        left_best_s: prescription.left_best_s?.toString() || '',
        left_best_c: prescription.left_best_c?.toString() || '',
        left_best_a: prescription.left_best_a?.toString() || '',
        left_auto_s: prescription.left_auto_s?.toString() || '',
        left_auto_c: prescription.left_auto_c?.toString() || '',
        left_auto_a: prescription.left_auto_a?.toString() || '',
        left_old_s: prescription.left_old_s?.toString() || '',
        left_old_c: prescription.left_old_c?.toString() || '',
        left_old_a: prescription.left_old_a?.toString() || '',
        left_old_va: prescription.left_old_va || '',
        left_old_year: prescription.left_old_year?.toString() || '',
        left_add: prescription.left_add?.toString() || '',
        left_pd: prescription.left_pd?.toString() || '',
        amount: prescription.amount?.toString() || '',
        credit_used: ((prescription as any).credit_used || 0).toString(),
        examiner: prescription.examiner || '',
        notes: prescription.notes || '',
      });
    }
  }, [prescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;

    const finalCreditUsed = Math.min(newCreditUsed, totalAvailableCredit);
    const finalCreditRemaining = totalAvailableCredit - finalCreditUsed;

    await updatePrescription.mutateAsync({
      id: prescription.id,
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
    });

    // 同步更新會員購物金餘額
    if (prescriptionMember && creditDifference !== 0) {
      await updateMember.mutateAsync({
        id: prescriptionMember.id,
        shopping_credit: memberCurrentCredit - creditDifference,
      });
    }

    onOpenChange(false);
  };

  const formatDecimal2 = (key: string) => {
    setFormData((prev: any) => {
      const val = prev[key];
      if (val === '' || val == null) return prev;
      const n = Number(val);
      if (isNaN(n)) return prev;
      return { ...prev, [key]: n.toFixed(2) };
    });
  };
  const formatInt = (key: string) => {
    setFormData((prev: any) => {
      const val = prev[key];
      if (val === '' || val == null) return prev;
      const n = parseInt(String(val), 10);
      if (isNaN(n)) return prev;
      return { ...prev, [key]: String(n) };
    });
  };

  const renderEyeSection = (prefix: 'right' | 'left') => (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <Label className="text-sm font-medium">最佳矯正度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <DecimalInput placeholder="-2.50"
              value={(formData as any)[`${prefix}_best_s`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_best_s`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <DecimalInput placeholder="-0.50"
              value={(formData as any)[`${prefix}_best_c`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_best_c`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <DecimalInput decimals={0} placeholder="180"
              value={(formData as any)[`${prefix}_best_a`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_best_a`]: v }))} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">電腦驗光度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <DecimalInput
              value={(formData as any)[`${prefix}_auto_s`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_auto_s`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <DecimalInput
              value={(formData as any)[`${prefix}_auto_c`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_auto_c`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <DecimalInput decimals={0}
              value={(formData as any)[`${prefix}_auto_a`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_auto_a`]: v }))} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">原戴眼鏡度數</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">球鏡 S</Label>
            <DecimalInput
              value={(formData as any)[`${prefix}_old_s`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_old_s`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <DecimalInput
              value={(formData as any)[`${prefix}_old_c`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_old_c`]: v }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <DecimalInput decimals={0}
              value={(formData as any)[`${prefix}_old_a`]}
              onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_old_a`]: v }))} />
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">ADD (老花度數)</Label>
          <DecimalInput placeholder="2.00"
            value={(formData as any)[`${prefix}_add`]}
            onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_add`]: v }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">PD (瞳距 mm)</Label>
          <DecimalInput placeholder="32"
            value={(formData as any)[`${prefix}_pd`]}
            onCommit={(v) => setFormData((p: any) => ({ ...p, [`${prefix}_pd`]: v }))} />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>編輯驗光記錄</DialogTitle>
          <DialogDescription>
            修改驗光處方資料
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 關聯交易提示 */}
            {linkedTransaction && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  此驗光記錄已連結至交易 
                </span>
                <Badge variant="secondary" className="text-xs">
                  {linkedTransaction.transaction_date} - NT${Number(linkedTransaction.total).toLocaleString()}
                </Badge>
              </div>
            )}

            {/* 會員等級與購物金資訊 */}
            {prescriptionMember && (
              <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">會員等級：</span>
                    <MemberBadge level={prescriptionMember.level} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">可用購物金：</span>
                    <span className="font-semibold text-primary">NT${totalAvailableCredit.toLocaleString()}</span>
                  </div>
                </div>

                {totalAvailableCredit > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="credit_used">折抵購物金</Label>
                      <span className="text-xs text-muted-foreground">
                        折抵後剩餘: NT${creditRemaining >= 0 ? creditRemaining.toLocaleString() : 0}
                      </span>
                    </div>
                    <Input
                      id="credit_used"
                      type="number"
                      min="0"
                      max={totalAvailableCredit}
                      placeholder={`最多可折抵 ${totalAvailableCredit}`}
                      value={formData.credit_used}
                      onChange={(e) => {
                        const value = Math.min(Number(e.target.value), totalAvailableCredit);
                        setFormData({ ...formData, credit_used: value >= 0 ? String(value) : e.target.value });
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 檢查日期與服務項目 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_date">檢查日期</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={formData.exam_date}
                  onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                />
              </div>
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
            </div>

            {/* 左右眼 Tabs */}
            <Tabs defaultValue="right" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="right">右眼 (OD)</TabsTrigger>
                <TabsTrigger value="left">左眼 (OS)</TabsTrigger>
              </TabsList>
              <TabsContent value="right" className="mt-4">
                {renderEyeSection('right')}
              </TabsContent>
              <TabsContent value="left" className="mt-4">
                {renderEyeSection('left')}
              </TabsContent>
            </Tabs>

            {/* 其他資訊 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    金額
                    {linkedTransaction && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (與交易記錄連動)
                      </span>
                    )}
                  </Label>
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
            disabled={updatePrescription.isPending} 
            className="gradient-primary text-primary-foreground"
          >
            {updatePrescription.isPending ? '儲存中...' : '儲存變更'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
