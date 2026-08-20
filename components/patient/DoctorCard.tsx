import { Avatar }  from "@/components/ui/Avatar";
import { Button }  from "@/components/ui/Button";
import { Badge }   from "@/components/ui/Badge";
import { Card }    from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { UserWithProfile } from "@/types";

interface DoctorCardProps {
  doctor:    UserWithProfile;
  onSelect?: (doctorId: string) => void;
  selected?: boolean;
}

export function DoctorCard({ doctor, onSelect, selected }: DoctorCardProps) {
  const profile = doctor.doctorProfile;
  if (!profile) return null;

  return (
    <Card
      hover={Boolean(onSelect)}
      className={selected ? "ring-2 ring-brand-500 border-brand-300" : ""}
    >
      <div className="flex items-start gap-4">
        <Avatar name={doctor.name} src={doctor.avatarUrl} size="lg" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">Dr(a). {doctor.name}</p>
              <p className="text-sm text-gray-500">{profile.specialty}</p>
              {profile.subSpecialty && (
                <p className="text-xs text-gray-400">{profile.subSpecialty}</p>
              )}
            </div>
            <Badge variant={profile.available ? "green" : "gray"} dot>
              {profile.available ? "Disponível" : "Indisponível"}
            </Badge>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">
              CRM {profile.crm}/{profile.crmState}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(Number(profile.consultationFee))}
              <span className="ml-1 text-xs font-normal text-gray-500">/ consulta</span>
            </p>

            {onSelect && (
              <Button
                size="sm"
                variant={selected ? "secondary" : "primary"}
                onClick={() => onSelect(doctor.id)}
                disabled={!profile.available}
              >
                {selected ? "Selecionado ✓" : "Selecionar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
