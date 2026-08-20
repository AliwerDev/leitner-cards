import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { uz } from "@/lib/i18n/uz";

export const metadata: Metadata = { title: uz.auth.registerSubmit };

export default function RegisterPage() {
  return <RegisterForm />;
}
