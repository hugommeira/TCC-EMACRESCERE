import 'package:dio/dio.dart';

import '../models/doctor_profile.dart';
import 'api_client.dart';

/// Paciente esperando na fila, como o médico vê (GET /api/queue/list).
class QueueItem {
  const QueueItem({
    required this.consultationId,
    required this.enqueuedAt,
    required this.patientId,
    required this.patientName,
    this.chiefComplaint,
    this.patientLastSeenAt,
    this.birthDate,
    this.gender,
    this.allergies = const [],
  });

  final String consultationId;
  final DateTime enqueuedAt;
  final String patientId;
  final String patientName;
  final String? chiefComplaint;
  final DateTime? patientLastSeenAt;
  final DateTime? birthDate;
  final String? gender;
  final List<String> allergies;

  int? get age {
    final b = birthDate;
    if (b == null) return null;
    final now = DateTime.now();
    var years = now.year - b.year;
    if (now.month < b.month || (now.month == b.month && now.day < b.day)) years--;
    return years;
  }

  Duration get waiting => DateTime.now().difference(enqueuedAt);

  factory QueueItem.fromJson(Map<String, dynamic> json) {
    final patient = json['patient'] as Map<String, dynamic>;
    final profile = patient['patientProfile'] as Map<String, dynamic>?;
    return QueueItem(
      consultationId: json['id'] as String,
      enqueuedAt: DateTime.parse(json['enqueuedAt'] as String),
      patientId: patient['id'] as String,
      patientName: patient['name'] as String? ?? 'Paciente',
      chiefComplaint: json['chiefComplaint'] as String?,
      patientLastSeenAt: json['patientLastSeenAt'] != null
          ? DateTime.parse(json['patientLastSeenAt'] as String)
          : null,
      birthDate: profile?['birthDate'] != null ? DateTime.parse(profile!['birthDate'] as String) : null,
      gender: profile?['gender'] as String?,
      allergies: (profile?['allergies'] as List?)?.map((e) => e.toString()).toList() ?? const [],
    );
  }
}

/// Erro de negócio das rotas do médico com mensagem legível (403 quando o
/// credenciamento ainda não foi aprovado, 409 quando outro médico pegou o
/// paciente primeiro etc.).
class DoctorFailure implements Exception {
  const DoctorFailure(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  bool get isNotApproved => statusCode == 403;

  @override
  String toString() => message;
}

/// Lado do médico. Contratos confirmados lendo app/api/queue/*,
/// app/api/doctor/profile e app/api/consultations/[id]/{end,prontuario}.
/// Todas as rotas exigem role DOCTOR e (fila/claim) credenciamento APPROVED.
class DoctorService {
  DoctorService._();

  static Future<DoctorProfile> getProfile() async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.get('/api/doctor/profile');
      return DoctorProfile.fromJson(response.data['profile'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível carregar seu perfil.');
    }
  }

  static Future<DoctorProfile> setAvailable(bool available) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.patch('/api/doctor/profile', data: {'available': available});
      return DoctorProfile.fromJson(response.data['profile'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível atualizar a disponibilidade.');
    }
  }

  static Future<List<QueueItem>> listQueue() async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.get('/api/queue/list');
      return (response.data['items'] as List)
          .map((e) => QueueItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível carregar a fila.');
    }
  }

  /// Pega o paciente da fila (atômico no backend: se outro médico pegou
  /// antes, vem 409). Devolve o id da consulta, agora IN_PROGRESS.
  static Future<String> claim(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.post('/api/queue/claim', data: {'consultationId': consultationId});
      return response.data['id'] as String;
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível iniciar o atendimento.');
    }
  }

  /// Consulta agendada: médico inicia (SCHEDULED/WAITING -> IN_PROGRESS).
  /// Contrato: PATCH /api/consultations/[id]/status { status } — só o
  /// médico da consulta, nas transições permitidas pelo backend.
  static Future<void> startConsultation(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      await dio.patch('/api/consultations/$consultationId/status', data: {'status': 'IN_PROGRESS'});
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível iniciar a consulta.');
    }
  }

  static Future<void> endConsultation(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      await dio.post('/api/consultations/$consultationId/end');
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível encerrar a consulta.');
    }
  }

  static Future<void> updateProntuario(
    String consultationId, {
    String? diagnosis,
    String? conduct,
    String? notes,
  }) async {
    final dio = await ApiClient.instance;
    try {
      await dio.patch(
        '/api/consultations/$consultationId/prontuario',
        data: {
          'diagnosis': ?diagnosis,
          'conduct': ?conduct,
          'notes': ?notes,
        },
      );
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível salvar o prontuário.');
    }
  }

  static DoctorFailure _toFailure(DioException e, {required String fallback}) {
    final data = e.response?.data;
    final message = data is Map ? data['message'] as String? : null;
    return DoctorFailure(message ?? fallback, statusCode: e.response?.statusCode);
  }
}
