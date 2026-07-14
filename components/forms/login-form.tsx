"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: LoginState = {
  ok: true,
  message: ""
};

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <Input name="username" label="Username" autoComplete="username" defaultValue="admin" required />
      <Input name="password" label="Password" type="password" autoComplete="current-password" required />
      {!state.ok ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{state.message}</p> : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>;
}
