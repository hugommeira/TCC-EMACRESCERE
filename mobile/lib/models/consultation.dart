import 'payment.dart';

enum ConsultationStatus { scheduled, waiting, inProgress, completed, cancelled, noShow }

extension ConsultationStatusX on ConsultationStatus {
  static ConsultationStatus fromJson(String value) => switch (value) {
        'SCHEDULED' => ConsultationStatus.scheduled,
        'WAITING' => ConsultationStatus.waiting,
        'IN_PROGRESS' => ConsultationStatus.inProgress,
        'COMPLETED' => ConsultationStatus.completed,
        'CANCELLED' => ConsultationStatus.cancelled,
        'NO_SHOW' => ConsultationStatus.noShow,
        _ => ConsultationStatus.scheduled,
      };

  String get label => switch (this) {
        ConsultationStatus.scheduled => 'Agendada',
        ConsultationStatus.waiting => 'Na fila',
        ConsultationStatus.inProgress => 'Em andamento',
        ConsultationStatus.completed => 'Concluída',
        ConsultationStatus.cancelled => 'Cancelada',
        ConsultationStatus.noShow => 'Não compareceu',
      };

  bool get isActive =>
      this == ConsultationStatus.scheduled ||
      this == ConsultationStatus.waiting ||
      this == ConsultationStatus.inProgress;
}

/// Uma das partes da consulta (médico ou paciente) — só o que a lista
/// precisa mostrar.
class ConsultationParty {
  const ConsultationParty({required this.id, required this.name, this.image});

  final String id;
  final String name;
  final String? image;

  factory ConsultationParty.fromJson(Map<String, dynamic> json, {String fallbackName = ''}) =>
      ConsultationParty(
        id: json['id'] as String,
        name: json['name'] as String? ?? fallbackName,
        // O backend usa avatarUrl; "image" fica por compatibilidade.
        image: (json['avatarUrl'] ?? json['image']) as String?,
      );
}

typedef ConsultationDoctor = ConsultationParty;

class Consultation {
  const Consultation({
    required this.id,
    required this.status,
    required this.createdAt,
    this.doctor,
    this.patient,
    this.scheduledAt,
    this.enqueuedAt,
    this.claimedAt,
    this.startedAt,
    this.endedAt,
    this.chiefComplaint,
    this.diagnosis,
    this.conduct,
    this.roomToken,
    this.prescriptionId,
    this.prescriptionStatus,
    this.prescriptionIssuedAt,
    this.payment,
  });

  final String id;
  final ConsultationStatus status;
  final DateTime createdAt;
  final ConsultationParty? doctor;

  /// Preenchido nas listas do médico (GET /api/consultations com role
  /// DOCTOR devolve o paciente de cada consulta).
  final ConsultationParty? patient;
  final DateTime? scheduledAt;
  final DateTime? enqueuedAt;
  final DateTime? claimedAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final String? chiefComplaint;
  final String? diagnosis;
  final String? conduct;
  final String? roomToken;
  final String? prescriptionId;
  final String? prescriptionStatus;

  /// Quando o médico assinou a receita (prescription.issuedAt).
  final DateTime? prescriptionIssuedAt;
  final PaymentInfo? payment;

  /// Consulta on-demand criada mas ainda sem pagamento confirmado — o
  /// backend deixa em SCHEDULED até o webhook/simulação do Asaas.
  bool get isAwaitingPayment =>
      status == ConsultationStatus.scheduled && scheduledAt == null && (payment?.isPending ?? false);

  /// On-demand (fila) vs. agendada com horário.
  bool get isOnDemand => scheduledAt == null;

  /// Rótulo de status pro paciente — distingue "agendada" de "criada mas
  /// sem pagamento", que no backend são o mesmo SCHEDULED.
  String get displayLabel => isAwaitingPayment ? 'Aguardando pagamento' : status.label;

  /// Melhor data pra exibir na lista (agendada, ou a mais recente disponível).
  DateTime get displayDate =>
      scheduledAt ?? startedAt ?? enqueuedAt ?? claimedAt ?? createdAt;

  factory Consultation.fromJson(Map<String, dynamic> json) {
    final prescription = json['prescription'] as Map<String, dynamic>?;
    return Consultation(
      id: json['id'] as String,
      status: ConsultationStatusX.fromJson(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      doctor: json['doctor'] != null
          ? ConsultationParty.fromJson(json['doctor'] as Map<String, dynamic>, fallbackName: 'Médico')
          : null,
      patient: json['patient'] != null
          ? ConsultationParty.fromJson(json['patient'] as Map<String, dynamic>, fallbackName: 'Paciente')
          : null,
      scheduledAt: _parseDate(json['scheduledAt']),
      enqueuedAt: _parseDate(json['enqueuedAt']),
      claimedAt: _parseDate(json['claimedAt']),
      startedAt: _parseDate(json['startedAt']),
      endedAt: _parseDate(json['endedAt']),
      chiefComplaint: json['chiefComplaint'] as String?,
      diagnosis: json['diagnosis'] as String?,
      conduct: json['conduct'] as String?,
      roomToken: json['roomToken'] as String?,
      prescriptionId: prescription?['id'] as String?,
      prescriptionStatus: prescription?['status'] as String?,
      prescriptionIssuedAt: _parseDate(prescription?['issuedAt']),
      payment: json['payment'] != null
          ? PaymentInfo.fromJson(json['payment'] as Map<String, dynamic>)
          : null,
    );
  }

  static DateTime? _parseDate(dynamic value) =>
      value == null ? null : DateTime.parse(value as String);
}
