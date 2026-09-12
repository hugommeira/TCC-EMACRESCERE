"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast }  from "@/components/ui/Toast";
import { confirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Ativa/desativa um usuário (POST /api/admin/users/[id]/toggle). A API já
 * existia; a tela de Usuários só mostrava o badge, sem jeito de agir.
 */
export function UserActiveToggle({
  userId,
  name,
  active,
  isSelf,
}: {
  userId: string;
  name:   string;
  active: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const ok = await confirmDialog({
      title:        active ? `Desativar ${name}?` : `Reativar ${name}?`,
      message:      active
        ? "A pessoa não consegue mais entrar na plataforma até ser reativada."
        : "A pessoa volta a conseguir entrar normalmente.",
      confirmLabel: active ? "Desativar" : "Reativar",
      tone:         active ? "danger" : "primary",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${userId}/toggle`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        toast.error(data.message ?? "Não foi possível alterar o status");
        return;
      }
      toast.success(data.message);
      router.refresh();
    } catch {
      toast.error("Falha de rede ao alterar o status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={active ? "green" : "red"} dot>
        {active ? "Ativo" : "Inativo"}
      </Badge>
      {!isSelf && (
        <Button
          variant={active ? "ghost" : "outline"}
          size="sm"
          loading={busy}
          onClick={toggle}
          aria-label={active ? `Desativar ${name}` : `Reativar ${name}`}
        >
          {active ? "Desativar" : "Reativar"}
        </Button>
      )}
    </div>
  );
}
