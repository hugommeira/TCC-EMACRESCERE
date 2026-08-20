"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter }           from "next/navigation";
import { useCallback }         from "react";
import type { Role }           from "@prisma/client";

interface UseAuthReturn {
  user:        { id: string; name: string; email: string; image?: string | null; role: Role } | null;
  isLoading:   boolean;
  isAuth:      boolean;
  role:        Role | null;
  isPatient:   boolean;
  isDoctor:    boolean;
  isAdmin:     boolean;
  logout:      () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  }, [router]);

  const user = session?.user ?? null;
  const role = (user?.role as Role) ?? null;

  return {
    user:      user as UseAuthReturn["user"],
    isLoading: status === "loading",
    isAuth:    status === "authenticated",
    role,
    isPatient: role === "PATIENT",
    isDoctor:  role === "DOCTOR",
    isAdmin:   role === "ADMIN" || role === "SUPER_ADMIN",
    logout,
  };
}
