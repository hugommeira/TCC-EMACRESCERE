"use client";

import { useState }    from "react";
import { Button }      from "@/components/ui/Button";
import { Input }       from "@/components/ui/Input";
import { Alert }       from "@/components/ui/Alert";
import { Card }        from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@prisma/client";

interface CheckoutFormProps {
  consultationId: string;
  amount:         number;
  doctorName:     string;
  onSuccess?:     (paymentId: string) => void;
}

type Step = "method" | "details" | "confirming" | "done";

export function CheckoutForm({
  consultationId,
  amount,
  doctorName,
  onSuccess,
}: CheckoutFormProps) {
  const [step,     setStep]     = useState<Step>("method");
  const [method,   setMethod]   = useState<PaymentMethod | null>(null);
  const [pixData,  setPixData]  = useState<{ qrCode?: string; copyPaste?: string } | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // Credit card fields
  const [card, setCard] = useState({
    holderName: "", number: "", expiryMonth: "",
    expiryYear: "", ccv: "", cpf: "", postalCode: "",
    addressNumber: "", phone: "",
  });

  function updateCard(field: keyof typeof card, value: string) {
    setCard((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePay() {
    if (!method) return;
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        consultationId,
        method,
        amount,
      };

      if (method === "CREDIT_CARD") {
        body.creditCard = {
          holderName:  card.holderName,
          number:      card.number.replace(/\s/g, ""),
          expiryMonth: card.expiryMonth,
          expiryYear:  card.expiryYear,
          ccv:         card.ccv,
          holderInfo: {
            name:          card.holderName,
            email:         "",        // preencher com dados do user
            cpfCnpj:       card.cpf,
            postalCode:    card.postalCode,
            addressNumber: card.addressNumber,
            phone:         card.phone,
          },
        };
      }

      const res  = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json() as {
        data?: { id: string; pixQrCode?: string; pixCopyPaste?: string; boletoUrl?: string };
        message?: string;
      };

      if (!res.ok) { setError(json.message ?? "Erro no pagamento"); return; }

      if (method === "PIX")    setPixData({ qrCode: json.data?.pixQrCode, copyPaste: json.data?.pixCopyPaste });
      if (method === "BOLETO") setBoletoUrl(json.data?.boletoUrl ?? null);

      setStep("done");
      onSuccess?.(json.data?.id ?? "");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Step: select method ─────────────────────────────────────────────────

  if (step === "method") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-brand-50 border border-brand-100 p-4">
          <p className="text-sm text-brand-700">Consulta com Dr(a). {doctorName}</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">{formatCurrency(amount)}</p>
        </div>

        <p className="text-sm font-medium text-gray-700">Forma de pagamento</p>

        <div className="grid gap-3">
          {(["PIX", "CREDIT_CARD", "BOLETO"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                method === m
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="text-2xl">{methodIcon(m)}</span>
              <div>
                <p className="font-medium text-gray-900">{methodLabel(m)}</p>
                <p className="text-xs text-gray-500">{methodDesc(m)}</p>
              </div>
            </button>
          ))}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <Button
          fullWidth
          size="lg"
          disabled={!method}
          onClick={() => {
            if (method === "PIX" || method === "BOLETO") void handlePay();
            else setStep("details");
          }}
          loading={loading}
        >
          {method === "CREDIT_CARD" ? "Preencher dados do cartão →" : `Pagar ${formatCurrency(amount)}`}
        </Button>
      </div>
    );
  }

  // ─── Step: credit card details ────────────────────────────────────────────

  if (step === "details") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          className="text-sm text-brand-600 hover:underline"
          onClick={() => setStep("method")}
        >
          ← Voltar
        </button>

        <h3 className="font-semibold text-gray-900">Dados do cartão</h3>

        <div className="space-y-3">
          <Input label="Nome no cartão" value={card.holderName} onChange={(e) => updateCard("holderName", e.target.value)} placeholder="Como impresso no cartão" required />
          <Input label="Número do cartão" value={card.number}     onChange={(e) => updateCard("number", e.target.value)}     placeholder="0000 0000 0000 0000"   required />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Mês" value={card.expiryMonth} onChange={(e) => updateCard("expiryMonth", e.target.value)} placeholder="MM" required />
            <Input label="Ano" value={card.expiryYear}  onChange={(e) => updateCard("expiryYear",  e.target.value)} placeholder="AAAA" required />
            <Input label="CVV" value={card.ccv}         onChange={(e) => updateCard("ccv", e.target.value)}         placeholder="123" required />
          </div>
          <Input label="CPF do titular" value={card.cpf} onChange={(e) => updateCard("cpf", e.target.value)} placeholder="00000000000" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CEP" value={card.postalCode} onChange={(e) => updateCard("postalCode", e.target.value)} placeholder="00000000" required />
            <Input label="Número" value={card.addressNumber} onChange={(e) => updateCard("addressNumber", e.target.value)} placeholder="123" required />
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <Button fullWidth size="lg" loading={loading} onClick={() => void handlePay()}>
          Pagar {formatCurrency(amount)}
        </Button>
      </div>
    );
  }

  // ─── Step: done ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 text-center">
      {method === "PIX" && pixData ? (
        <PixPayment {...pixData} />
      ) : method === "BOLETO" && boletoUrl ? (
        <BoletoPayment url={boletoUrl} />
      ) : (
        <Alert variant="success" title="Pagamento aprovado!">
          Sua consulta foi confirmada. Acesse o painel para entrar na sala.
        </Alert>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PixPayment({ qrCode, copyPaste }: { qrCode?: string; copyPaste?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (!copyPaste) return;
    void navigator.clipboard.writeText(copyPaste).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <Card className="space-y-4">
      <p className="font-semibold text-gray-900">Pague com PIX</p>
      {qrCode && (
        <img src={`data:image/png;base64,${qrCode}`} alt="QR Code PIX" className="mx-auto h-48 w-48" />
      )}
      {copyPaste && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Ou copie o código:</p>
          <div className="rounded-lg bg-gray-50 border p-3 font-mono text-xs break-all text-gray-700">
            {copyPaste.slice(0, 40)}…
          </div>
          <Button variant="outline" fullWidth onClick={copy}>
            {copied ? "Copiado! ✓" : "Copiar código PIX"}
          </Button>
        </div>
      )}
      <Alert variant="info">O pagamento é confirmado automaticamente em até 1 minuto.</Alert>
    </Card>
  );
}

function BoletoPayment({ url }: { url: string }) {
  return (
    <Card className="space-y-3">
      <p className="font-semibold text-gray-900">Boleto gerado</p>
      <p className="text-sm text-gray-500">Vencimento em 1 dia útil.</p>
      <Button
        as="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        fullWidth
        variant="outline"
      >
        Abrir boleto
      </Button>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function methodIcon(m: PaymentMethod) {
  return { PIX: "⚡", CREDIT_CARD: "💳", BOLETO: "🏦" }[m];
}
function methodLabel(m: PaymentMethod) {
  return { PIX: "PIX", CREDIT_CARD: "Cartão de crédito", BOLETO: "Boleto bancário" }[m];
}
function methodDesc(m: PaymentMethod) {
  return {
    PIX:         "Aprovação imediata",
    CREDIT_CARD: "Aprovação imediata",
    BOLETO:      "Aprovação em até 3 dias úteis",
  }[m];
}
