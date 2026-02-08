import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AuthFormValues = {
  username: string;
  email?: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

type AuthFormProps = {
  mode: "login" | "register";
  isSubmitting?: boolean;
  onSubmit: (values: AuthFormValues) => void;
  error?: string | null;
};

const AuthForm = ({ mode, isSubmitting, onSubmit, error }: AuthFormProps) => {
  const isRegister = mode === "register";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSubmit({
      username: String(formData.get("username") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
    });
  };

  return (
    <div className="bg-background border border-border rounded-sm p-8 md:p-10">
      <div className="mb-8">
        <p className="vogue-subheading text-primary mb-2">
          {isRegister ? "Create Account" : "Welcome Back"}
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          {isRegister ? "Join Golden Aura" : "Sign in to your account"}
        </h1>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {isRegister && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                First Name
              </label>
              <Input name="first_name" placeholder="Ama" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
                Last Name
              </label>
              <Input name="last_name" placeholder="Gyamfua" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
            Username
          </label>
          <Input name="username" placeholder="goldenaura" required />
        </div>

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
              Email
            </label>
            <Input name="email" type="email" placeholder="you@email.com" required />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2">
            Password
          </label>
          <Input name="password" type="password" placeholder="••••••••" required />
        </div>

        {error && (
          <div className="text-xs text-destructive font-semibold">{error}</div>
        )}

        <Button
          type="submit"
          className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-wide"
          disabled={isSubmitting}
        >
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 text-xs text-muted-foreground">
        {isRegister ? "Already have an account?" : "New to Golden Aura?"} {""}
        <Link
          to={isRegister ? "/login" : "/register"}
          className="text-foreground font-semibold hover:text-primary transition-colors"
        >
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </div>
    </div>
  );
};

export default AuthForm;
