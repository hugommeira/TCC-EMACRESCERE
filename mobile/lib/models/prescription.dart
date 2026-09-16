class PrescriptionItem {
  const PrescriptionItem({
    required this.name,
    required this.dosage,
    required this.frequency,
    this.presentation,
    this.duration,
    this.instructions,
  });

  final String name;
  final String? presentation;
  final String dosage;
  final String frequency;
  final String? duration;
  final String? instructions;

  factory PrescriptionItem.fromJson(Map<String, dynamic> json) => PrescriptionItem(
        name: json['name'] as String,
        presentation: json['presentation'] as String?,
        dosage: json['dosage'] as String,
        frequency: json['frequency'] as String,
        duration: json['duration'] as String?,
        instructions: json['instructions'] as String?,
      );
}

class Prescription {
  const Prescription({
    required this.id,
    required this.status,
    required this.items,
    this.notes,
    this.issuedAt,
  });

  final String id;

  /// DRAFT | ISSUED | CANCELLED
  final String status;
  final List<PrescriptionItem> items;
  final String? notes;
  final DateTime? issuedAt;

  bool get isIssued => status == 'ISSUED';

  factory Prescription.fromJson(Map<String, dynamic> json) => Prescription(
        id: json['id'] as String,
        status: json['status'] as String,
        notes: json['notes'] as String?,
        issuedAt: json['issuedAt'] != null ? DateTime.parse(json['issuedAt'] as String) : null,
        items: (json['items'] as List? ?? [])
            .map((e) => PrescriptionItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
