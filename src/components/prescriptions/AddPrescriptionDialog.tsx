import { useState } from 'react';
import { useCreatePrescription } from '@/hooks/usePrescriptions';
import { useMembers } from '@/hooks/useMembers';
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

interface AddPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPrescriptionDialog({ open, onOpenChange }: AddPrescriptionDialogProps) {
  const { data: members } = useMembers();
  const createPrescription = useCreatePrescription();

  const [formData, setFormData] = useState({
    member_id: '',
    exam_date: new Date().toISOString().split('T')[0],
    
    // 右眼
    right_sc_naked: '',
    right_cc_best: '',
    right_best_sphere: '',
    right_best_cylinder: '',
    right_best_axis: '',
    right_auto_sphere: '',
    right_auto_cylinder: '',
    right_auto_axis: '',
    right_old_sphere: '',
    right_old_cylinder: '',
    right_old_axis: '',
    right_old_vision: '',
    right_old_years: '',
    right_add: '',
    right_pd: '',
    
    // 左眼
    left_sc_naked: '',
    left_cc_best: '',
    left_best_sphere: '',
    left_best_cylinder: '',
    left_best_axis: '',
    left_auto_sphere: '',
    left_auto_cylinder: '',
    left_auto_axis: '',
    left_old_sphere: '',
    left_old_cylinder: '',
    left_old_axis: '',
    left_old_vision: '',
    left_old_years: '',
    left_add: '',
    left_pd: '',
    
    // 其他
    amount: '',
    examiner: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createPrescription.mutateAsync({
      member_id: formData.member_id,
      exam_date: formData.exam_date,
      
      right_sc_naked: formData.right_sc_naked || undefined,
      right_cc_best: formData.right_cc_best || undefined,
      right_best_sphere: formData.right_best_sphere ? Number(formData.right_best_sphere) : undefined,
      right_best_cylinder: formData.right_best_cylinder ? Number(formData.right_best_cylinder) : undefined,
      right_best_axis: formData.right_best_axis ? Number(formData.right_best_axis) : undefined,
      right_auto_sphere: formData.right_auto_sphere ? Number(formData.right_auto_sphere) : undefined,
      right_auto_cylinder: formData.right_auto_cylinder ? Number(formData.right_auto_cylinder) : undefined,
      right_auto_axis: formData.right_auto_axis ? Number(formData.right_auto_axis) : undefined,
      right_old_sphere: formData.right_old_sphere ? Number(formData.right_old_sphere) : undefined,
      right_old_cylinder: formData.right_old_cylinder ? Number(formData.right_old_cylinder) : undefined,
      right_old_axis: formData.right_old_axis ? Number(formData.right_old_axis) : undefined,
      right_old_vision: formData.right_old_vision || undefined,
      right_old_years: formData.right_old_years ? Number(formData.right_old_years) : undefined,
      right_add: formData.right_add ? Number(formData.right_add) : undefined,
      right_pd: formData.right_pd ? Number(formData.right_pd) : undefined,
      
      left_sc_naked: formData.left_sc_naked || undefined,
      left_cc_best: formData.left_cc_best || undefined,
      left_best_sphere: formData.left_best_sphere ? Number(formData.left_best_sphere) : undefined,
      left_best_cylinder: formData.left_best_cylinder ? Number(formData.left_best_cylinder) : undefined,
      left_best_axis: formData.left_best_axis ? Number(formData.left_best_axis) : undefined,
      left_auto_sphere: formData.left_auto_sphere ? Number(formData.left_auto_sphere) : undefined,
      left_auto_cylinder: formData.left_auto_cylinder ? Number(formData.left_auto_cylinder) : undefined,
      left_auto_axis: formData.left_auto_axis ? Number(formData.left_auto_axis) : undefined,
      left_old_sphere: formData.left_old_sphere ? Number(formData.left_old_sphere) : undefined,
      left_old_cylinder: formData.left_old_cylinder ? Number(formData.left_old_cylinder) : undefined,
      left_old_axis: formData.left_old_axis ? Number(formData.left_old_axis) : undefined,
      left_old_vision: formData.left_old_vision || undefined,
      left_old_years: formData.left_old_years ? Number(formData.left_old_years) : undefined,
      left_add: formData.left_add ? Number(formData.left_add) : undefined,
      left_pd: formData.left_pd ? Number(formData.left_pd) : undefined,
      
      amount: formData.amount ? Number(formData.amount) : undefined,
      examiner: formData.examiner || undefined,
      notes: formData.notes || undefined,
    });

    // Reset form
    setFormData({
      member_id: '',
      exam_date: new Date().toISOString().split('T')[0],
      right_sc_naked: '',
      right_cc_best: '',
      right_best_sphere: '',
      right_best_cylinder: '',
      right_best_axis: '',
      right_auto_sphere: '',
      right_auto_cylinder: '',
      right_auto_axis: '',
      right_old_sphere: '',
      right_old_cylinder: '',
      right_old_axis: '',
      right_old_vision: '',
      right_old_years: '',
      right_add: '',
      right_pd: '',
      left_sc_naked: '',
      left_cc_best: '',
      left_best_sphere: '',
      left_best_cylinder: '',
      left_best_axis: '',
      left_auto_sphere: '',
      left_auto_cylinder: '',
      left_auto_axis: '',
      left_old_sphere: '',
      left_old_cylinder: '',
      left_old_axis: '',
      left_old_vision: '',
      left_old_years: '',
      left_add: '',
      left_pd: '',
      amount: '',
      examiner: '',
      notes: '',
    });
    onOpenChange(false);
  };

  const EyeSection = ({ eye, prefix }: { eye: '右眼' | '左眼'; prefix: 'right' | 'left' }) => (
    <div className="space-y-4">
      {/* 視力 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">SC 裸視</Label>
          <Input
            placeholder="0.5"
            value={(formData as any)[`${prefix}_sc_naked`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_sc_naked`]: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">CC 最佳視力</Label>
          <Input
            placeholder="1.0"
            value={(formData as any)[`${prefix}_cc_best`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_cc_best`]: e.target.value })}
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
              value={(formData as any)[`${prefix}_best_sphere`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_sphere`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              placeholder="-0.50"
              value={(formData as any)[`${prefix}_best_cylinder`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_cylinder`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              placeholder="180"
              value={(formData as any)[`${prefix}_best_axis`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_best_axis`]: e.target.value })}
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
              value={(formData as any)[`${prefix}_auto_sphere`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_sphere`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_auto_cylinder`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_cylinder`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              value={(formData as any)[`${prefix}_auto_axis`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_auto_axis`]: e.target.value })}
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
              value={(formData as any)[`${prefix}_old_sphere`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_sphere`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">柱鏡 C</Label>
            <Input
              type="number"
              step="0.25"
              value={(formData as any)[`${prefix}_old_cylinder`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_cylinder`]: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">軸位 A</Label>
            <Input
              type="number"
              min="0"
              max="180"
              value={(formData as any)[`${prefix}_old_axis`]}
              onChange={(e) => setFormData({ ...formData, [`${prefix}_old_axis`]: e.target.value })}
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
            value={(formData as any)[`${prefix}_old_vision`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_old_vision`]: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">配戴期 (年)</Label>
          <Input
            type="number"
            min="0"
            placeholder="2"
            value={(formData as any)[`${prefix}_old_years`]}
            onChange={(e) => setFormData({ ...formData, [`${prefix}_old_years`]: e.target.value })}
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

            {/* 左右眼 Tabs */}
            <Tabs defaultValue="right" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="right">右眼 (OD)</TabsTrigger>
                <TabsTrigger value="left">左眼 (OS)</TabsTrigger>
              </TabsList>
              <TabsContent value="right" className="mt-4">
                <EyeSection eye="右眼" prefix="right" />
              </TabsContent>
              <TabsContent value="left" className="mt-4">
                <EyeSection eye="左眼" prefix="left" />
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
