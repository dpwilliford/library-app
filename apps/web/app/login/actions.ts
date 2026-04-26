"use server";

import { redirect } from "next/navigation";
import { findDemoUser } from "@/lib/demoUsers";
import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = findDemoUser(email, password);
  if (!user) {
    redirect("/login?error=1");
  }

  await createSession({
    email: user.email,
    name: user.name,
    role: user.role
  });

  redirect("/dashboard");
}
