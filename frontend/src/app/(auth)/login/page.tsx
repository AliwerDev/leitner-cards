import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.auth.loginSubmit };

export default function LoginPage() {
  return <LoginForm />;
}
