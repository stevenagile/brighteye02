import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Glasses, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6">
          <Glasses className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          抱歉，找不到您請求的頁面
        </p>
        <Button asChild className="gradient-primary text-primary-foreground">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            返回首頁
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
