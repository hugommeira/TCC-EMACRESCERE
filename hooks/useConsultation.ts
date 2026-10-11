"use client";

import { useState, useCallback } from "react";
import type { ConsultationWithParties } from "@/types";
import type { ConsultationStatus } from "@prisma/client";
import { apiFetch, mensagemDeErro } from "@/lib/api-client";

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
      const json = await apiFetch<{ data: ConsultationWithParties }>(`/api/consultations/${id}`);
      setConsultation(json.data);
    } catch (e) {
      setError(mensagemDeErro(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (id: string, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const json = await apiFetch<{ data: ConsultationWithParties }>(`/api/consultations/${id}/cancel`, {
        method: "POST",
        body:   { reason },
      });
      setConsultation(json.data);
    } catch (e) {
      setError(mensagemDeErro(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: ConsultationStatus) => {
      setIsLoading(true);
      setError(null);

      try {
        const json = await apiFetch<{ data: ConsultationWithParties }>(`/api/consultations/${id}/status`, {
          method: "PATCH",
          body:   { status },
        });
        setConsultation(json.data);
      } catch (e) {
        setError(mensagemDeErro(e));
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
