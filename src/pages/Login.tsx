import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Glasses, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 同步瀏覽器自動填入的值（autofill 不會觸發 React onChange）
  useEffect(() => {
    const sync = () => {
      if (emailRef.current && emailRef.current.value !== email) {
        setEmail(emailRef.current.value);
      }
      if (passwordRef.current && passwordRef.current.value !== password) {
        setPassword(passwordRef.current.value);
      }
    };
    // 首次掛載後稍延遲讓瀏覽器完成 autofill
    const t1 = setTimeout(sync, 50);
    const t2 = setTimeout(sync, 300);
    const t3 = setTimeout(sync, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 最終以 DOM 真實值為準，避免 autofill 未同步到 state
    const finalEmail = (emailRef.current?.value ?? email).trim();
    const finalPassword = passwordRef.current?.value ?? password;

    if (!finalEmail || !finalPassword) {
      toast.error('請輸入電子郵件與密碼');
      return;
    }
    setEmail(finalEmail);
    setPassword(finalPassword);
    setIsLoading(true);

    try {
      const { error } = await signIn(finalEmail, finalPassword);
      if (error) {
        toast.error('登入失敗。請檢查您的電子郵件和密碼。');
      } else {
        toast.success('登入成功！');
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="stat-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Glasses className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">伯洸眼鏡行</h1>
            <p className="text-muted-foreground mt-1">管理系統</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="請輸入電子郵件"
                value={email}
                ref={emailRef}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="請輸入密碼"
                  value={password}
                  ref={passwordRef}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? '處理中...' : '登入'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
