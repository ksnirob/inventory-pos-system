"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, createSessionToken, defaultPasswordHash, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  ok: boolean;
  message: string;
};

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      adminUsername: "admin",
      adminPasswordHash: defaultPasswordHash
    }
  });

  if (username !== settings.adminUsername || hashPassword(password) !== settings.adminPasswordHash) {
    return { ok: false, message: "Invalid username or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(authCookieName, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  redirect("/login");
}
