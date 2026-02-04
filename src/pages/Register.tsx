import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm, { type AuthFormValues } from "@/components/AuthForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useRegister } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const meQuery = useMe();

  const errorMessage = useMemo(() => {
    const error = register.error as { message?: string } | undefined;
    return error?.message ?? null;
  }, [register.error]);

  const handleSubmit = (values: AuthFormValues) => {
    register.mutate(
      {
        username: values.username,
        email: values.email || "",
        password: values.password,
        first_name: values.first_name || "",
        last_name: values.last_name || "",
      },
      {
        onSuccess: () => {
          navigate("/login");
        },
      }
    );
  };

  useEffect(() => {
    if (!meQuery.data?.user) return;
    if (meQuery.data.profile?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [meQuery.data, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <AuthForm
            mode="register"
            isSubmitting={register.isPending}
            onSubmit={handleSubmit}
            error={errorMessage}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
