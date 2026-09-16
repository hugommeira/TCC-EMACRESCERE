/// Perfil do médico logado — `doctorProfile` em GET /api/users/[id] ou
/// `profile` em GET /api/doctor/profile.
class DoctorProfile {
  const DoctorProfile({
    required this.crm,
    required this.crmState,
    required this.specialty,
    required this.approvalStatus,
    required this.available,
    this.subSpecialty,
    this.bio,
    this.consultationFee,
    this.approvalNote,
    this.crmSituation,
  });

  final String crm;
  final String crmState;
  final String specialty;
  final String? subSpecialty;
  final String? bio;
  final double? consultationFee;
  final bool available;

  /// PENDING | APPROVED | REJECTED — credenciamento decidido pelo admin no
  /// site. Médicos do seed nascem APPROVED.
  final String approvalStatus;
  final String? approvalNote;

  /// Resultado da verificação (simulada) do CRM feita no cadastro:
  /// ATIVO | SUSPENSO | NAO_ENCONTRADO.
  final String? crmSituation;

  bool get isApproved => approvalStatus == 'APPROVED';
  bool get isRejected => approvalStatus == 'REJECTED';
  bool get isPending => !isApproved && !isRejected;

  String get crmLabel => 'CRM $crm/$crmState';

  factory DoctorProfile.fromJson(Map<String, dynamic> json) {
    final verification = json['crmVerification'];
    return DoctorProfile(
      crm: json['crm'] as String,
      crmState: json['crmState'] as String,
      specialty: json['specialty'] as String? ?? '',
      subSpecialty: json['subSpecialty'] as String?,
      bio: json['bio'] as String?,
      consultationFee: json['consultationFee'] != null
          ? double.tryParse(json['consultationFee'].toString())
          : null,
      available: json['available'] as bool? ?? false,
      approvalStatus: json['approvalStatus'] as String? ?? 'APPROVED',
      approvalNote: json['approvalNote'] as String?,
      crmSituation: verification is Map ? verification['situation'] as String? : null,
    );
  }
}
