import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";

import AuthForm, { type AuthFormValues } from "@/components/AuthForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useLogin } from "@/hooks/useAuth";
import { useMergeCart } from "@/hooks/useCart";
import { useMe } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const mergeCart = useMergeCart();
  const meQuery = useMe();
  const { toast } = useToast();
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const errorMessage = useMemo(() => {
    const error = login.error as { message?: string } | undefined;
    return error?.message ?? (login.isError ? "Unable to sign in. Please try again." : null);
  }, [login.error]);

  const handleSubmit = (values: AuthFormValues) => {
    login.mutate(
      { username: values.username, password: values.password },
      {
        onSuccess: async () => {
          try {
            await mergeCart.mutateAsync();
          } catch {
            // Cart merge errors shouldn't block login.
          }
          const result = await meQuery.refetch();
          if (!result.data?.user) {
            toast({
              title: "Signed in",
              description: "Session updated. Please continue.",
            });
            setPendingRedirect(true);
            return;
          }
          toast({ title: "Signed in", description: "Welcome back." });
          setPendingRedirect(true);
        },
        onError: () => {
          toast({
            title: "Sign in failed",
            description: "Check your credentials and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  useEffect(() => {
    if (meQuery.data?.user) {
      if (meQuery.data.profile?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/catalog", { replace: true });
      }
      return;
    }
    if (!pendingRedirect || !meQuery.data?.user) return;
    const redirectTo = (location.state as { from?: Location })?.from?.pathname;
    if (redirectTo) {
      navigate(redirectTo, { replace: true });
      return;
    }
    if (meQuery.data.profile?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/catalog", { replace: true });
    }
  }, [location.state, meQuery.data, navigate, pendingRedirect]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <AuthForm
            mode="login"
            isSubmitting={login.isPending}
            onSubmit={handleSubmit}
            error={errorMessage}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
