"use client";

import { useState, useCallback } from "react";
import type { ConsultationWithParties } from "@/types";
import type { ConsultationStatus } from "@prisma/client";

interface UseConsultationReturn {
  consultation: ConsultationWithParties | null;
  isLoading:    boolean;
  error:        string | null;
  fetch:        (id: string) => Promise<void>;
  cancel:       (id: string, reason?: string) => Promise<void>;
  updateStatus: (id: string, status: ConsultationStatus) => Promise<void>;
}

export function useConsultation(): UseConsultationReturn {
  const [consultation, setConsultation] = useState<ConsultationWithParties | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const fetchConsultation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res  = await fetch(`/api/consultations/${id}`);
      const json = await res.json() as { data: ConsultationWithParties };

      if (!res.ok) throw new Error((json as unknown as { message: string }).message);
      setConsultation(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar consulta");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (id: string, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/consultations/${id}/cancel`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json() as { message: string };
        throw new Error(err.message);
      }

      const json = await res.json() as { data: ConsultationWithParties };
      setConsultation(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cancelar consulta");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: ConsultationStatus) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/consultations/${id}/status`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status }),
        });

        if (!res.ok) {
          const err = await res.json() as { message: string };
          throw new Error(err.message);
        }

        const json = await res.json() as { data: ConsultationWithParties };
        setConsultation(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar consulta");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    consultation,
    isLoading,
    error,
    fetch:        fetchConsultation,
    cancel,
    updateStatus,
  };
}
