import { MainLayout } from '@/components/layout/MainLayout';
import { Store, Users, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
          <p className="text-muted-foreground mt-1">管理店鋪資訊和系統配置</p>
        </div>

        <div className="grid gap-6">
          {/* Store Info */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">店鋪資訊</h3>
                <p className="text-sm text-muted-foreground">基本店鋪資料設定</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">店鋪名稱</Label>
                <Input id="storeName" defaultValue="伯洸眼鏡行" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">聯絡電話</Label>
                <Input id="phone" defaultValue="02-12345678" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">店鋪地址</Label>
                <Input id="address" defaultValue="台北市XX區XX路XX號" />
              </div>
            </div>
          </div>

          {/* Member Settings */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-gold">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">會員等級設定</h3>
                <p className="text-sm text-muted-foreground">配置各等級會員的權益</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 border border-border rounded-xl">
                <div className="member-badge-gold mb-4">金卡會員</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">消費折扣</span>
                    <span className="font-medium">9折</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">積分倍率</span>
                    <span className="font-medium">2倍</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <div className="member-badge-silver mb-4">銀卡會員</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">消費折扣</span>
                    <span className="font-medium">95折</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">積分倍率</span>
                    <span className="font-medium">1.5倍</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-border rounded-xl">
                <div className="member-badge-black mb-4">黑卡會員</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">消費折扣</span>
                    <span className="font-medium">85折</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">積分倍率</span>
                    <span className="font-medium">3倍</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">通知設定</h3>
                <p className="text-sm text-muted-foreground">配置系統通知和提醒</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <p className="font-medium text-foreground">低庫存提醒</p>
                  <p className="text-sm text-muted-foreground">當商品庫存低於閾值時通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <p className="font-medium text-foreground">會員生日提醒</p>
                  <p className="text-sm text-muted-foreground">在會員生日前一週發送提醒</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <p className="font-medium text-foreground">每日銷售報告</p>
                  <p className="text-sm text-muted-foreground">每日發送銷售匯總郵件</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
