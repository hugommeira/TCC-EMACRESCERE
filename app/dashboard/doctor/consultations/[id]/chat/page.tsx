import type { Metadata }  from "next";
import { notFound, redirect } from "next/navigation";
import { auth }           from "@/lib/auth";
import { getConsultationById } from "@/services/api/consultation";
import { ChatWindow }     from "@/components/chat/ChatWindow";
import { PrescriptionForm } from "@/components/prescription/PrescriptionForm";
import { Card, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Sala de consulta" };

interface Props {
  params: { id: string };
}

export default async function DoctorChatPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DOCTOR") redirect("/auth/login");

  let consultation;
  try {
    consultation = await getConsultationById(params.id, session.user.id);
  } catch {
    notFound();
  }

  if (!consultation.roomToken) notFound();

  const patientName = consultation.patient.name;

  return (
    <div className="h-[calc(100vh-4rem)] p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat - 2/3 */}
      <div className="lg:col-span-2 min-h-0 flex flex-col">
        <ChatWindow
          consultationId={consultation.id}
          roomToken={consultation.roomToken}
          currentUserId={session.user.id}
          currentUserName={session.user.name}
          otherUserName={patientName}
        />
      </div>

      {/* Side panel - 1/3 */}
      <div className="overflow-y-auto scrollbar-thin space-y-4">
        {/* Patient info */}
        <Card padding="sm">
          <CardTitle>Paciente</CardTitle>
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p className="font-medium text-gray-900">{patientName}</p>
            {consultation.chiefComplaint && (
              <p className="text-gray-500">
                <span className="font-medium">Queixa:</span> {consultation.chiefComplaint}
              </p>
            )}
          </div>
        </Card>

        {/* Prescription */}
        {!consultation.prescription && (
          <Card padding="sm">
            <CardTitle>Prescrição</CardTitle>
            <p className="mt-1 mb-3 text-xs text-gray-500">
              Crie a prescrição durante ou ao finalizar a consulta.
            </p>
            <PrescriptionForm consultationId={consultation.id} />
          </Card>
        )}

        {consultation.prescription && (
          <Card padding="sm">
            <CardTitle>Prescrição</CardTitle>
            <p className="mt-2 text-sm text-green-600 font-medium">
              ✓ Prescrição criada
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
