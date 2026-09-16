/// Médico disponível para agendamento (GET /api/users?doctors=true).
class Doctor {
  const Doctor({
    required this.id,
    required this.name,
    this.specialty,
    this.consultationFee,
    this.image,
  });

  final String id;
  final String name;
  final String? specialty;
  final double? consultationFee;
  final String? image;

  factory Doctor.fromJson(Map<String, dynamic> json) {
    final profile = json['doctorProfile'] as Map<String, dynamic>?;
    return Doctor(
      id: json['id'] as String,
      name: json['name'] as String,
      specialty: profile?['specialty'] as String?,
      consultationFee: profile?['consultationFee'] != null
          ? double.tryParse(profile!['consultationFee'].toString())
          : null,
      image: (json['avatarUrl'] ?? json['image']) as String?,
    );
  }
}
