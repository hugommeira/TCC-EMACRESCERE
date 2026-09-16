import 'doctor_profile.dart';

/// Perfil completo do usuário — User + PatientProfile (paciente) ou
/// DoctorProfile (médico), de GET/PATCH /api/users/[id] no backend.
class UserProfile {
  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.cpf,
    this.birthDate,
    this.gender,
    this.bloodType,
    this.allergies = const [],
    this.medications = const [],
    this.notes,
    this.role = 'PATIENT',
    this.doctorProfile,
  });

  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? cpf;
  final DateTime? birthDate;
  final String? gender;
  final String? bloodType;
  final List<String> allergies;
  final List<String> medications;
  final String? notes;

  /// PATIENT | DOCTOR | ADMIN | SUPER_ADMIN
  final String role;
  final DoctorProfile? doctorProfile;

  bool get isDoctor => role == 'DOCTOR';

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final profile = json['patientProfile'] as Map<String, dynamic>?;
    return UserProfile(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      cpf: json['cpf'] as String?,
      birthDate: profile?['birthDate'] != null
          ? DateTime.parse(profile!['birthDate'] as String)
          : null,
      gender: profile?['gender'] as String?,
      bloodType: profile?['bloodType'] as String?,
      allergies: (profile?['allergies'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      medications:
          (profile?['medications'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      notes: profile?['notes'] as String?,
      role: json['role'] as String? ?? 'PATIENT',
      doctorProfile: json['doctorProfile'] != null
          ? DoctorProfile.fromJson(json['doctorProfile'] as Map<String, dynamic>)
          : null,
    );
  }
}
