import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useMe } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

type AdminRouteProps = {
  children: ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { data: me, isLoading } = useMe();
  const location = useLocation();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm font-semibold text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!me?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (me.profile?.role !== "admin") {
    toast({
      title: "Access denied",
      description: "Admin access only.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
