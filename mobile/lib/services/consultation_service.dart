import 'package:dio/dio.dart';

import '../models/consultation.dart';
import '../models/day_slot.dart';
import '../models/doctor.dart';
import '../models/payment.dart';
import 'api_client.dart';

/// Erro de negócio das rotas de consulta, com mensagem legível — 409 quando
/// o horário acabou de ser ocupado, 422 de validação, 402 de pagamento.
class ConsultationFailure implements Exception {
  const ConsultationFailure(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  /// Alguém pegou o horário entre a escolha e a confirmação.
  bool get isSlotTaken => statusCode == 409;

  @override
  String toString() => message;
}

ConsultationFailure _toFailure(DioException e, {required String fallback}) {
  final data = e.response?.data;
  final message = data is Map ? data['message'] as String? : null;
  return ConsultationFailure(message ?? fallback, statusCode: e.response?.statusCode);
}

/// Consultas reais do backend — histórico, detalhe, prontuário (embutido no
/// detalhe) e prescrição (embutida no detalhe também).
///
/// Contrato confirmado lendo o backend (app/api/consultations):
/// GET /api/consultations -> { data: { data: Consultation[], total, page, limit, pages } }
/// GET /api/consultations/[id] -> { data: Consultation } (com prescription/messages/followUps aninhados)
class ConsultationService {
  ConsultationService._();

  static Future<List<Consultation>> getConsultations({int limit = 20}) async {
    final dio = await ApiClient.instance;
    final response = await dio.get(
      '/api/consultations',
      queryParameters: {'limit': limit},
    );
    final list = (response.data['data']['data'] as List)
        .map((e) => Consultation.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  static Future<Consultation> getConsultationDetail(String id) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/consultations/$id');
    return Consultation.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// Cancela uma consulta do paciente (POST /api/consultations/[id]/cancel).
  /// O backend recusa (409) se já estiver COMPLETED ou CANCELLED.
  static Future<Consultation> cancelConsultation(String id, {String? reason}) async {
    final dio = await ApiClient.instance;
    final response = await dio.post(
      '/api/consultations/$id/cancel',
      data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
    );
    return Consultation.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// Baixa os bytes do PDF assinado da prescrição.
  /// TODO(api): só funciona se prescription.status == "ISSUED" (backend
  /// retorna 409 pra rascunhos sem PDF ainda).
  static Future<List<int>> downloadPrescriptionPdf(String prescriptionId) async {
    final dio = await ApiClient.instance;
    final response = await dio.get<List<int>>(
      '/api/prescriptions/$prescriptionId/pdf',
      options: Options(responseType: ResponseType.bytes),
    );
    return response.data!;
  }

  /// Médicos disponíveis pra agendamento (GET /api/users?doctors=true).
  static Future<List<Doctor>> getDoctors({String? search}) async {
    final dio = await ApiClient.instance;
    final response = await dio.get(
      '/api/users',
      queryParameters: {
        'doctors': 'true',
        'limit': 20,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    final list = (response.data['data']['data'] as List)
        .map((e) => Doctor.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  /// Horários que o médico oferece num dia, já marcando os ocupados e os
  /// que passaram (GET /api/doctors/:id/slots?date=AAAA-MM-DD).
  ///
  /// Vem vazio quando o médico não configurou agenda, está indisponível ou
  /// não foi aprovado pelo administrador.
  static Future<List<DaySlot>> getDoctorSlots(String doctorId, DateTime date) async {
    final dio = await ApiClient.instance;
    final dia = '${date.year.toString().padLeft(4, '0')}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';
    try {
      final response = await dio.get(
        '/api/doctors/$doctorId/slots',
        queryParameters: {'date': dia},
      );
      return (response.data['data']['slots'] as List)
          .map((e) => DaySlot.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível carregar os horários.');
    }
  }

  /// Agenda uma consulta com médico e horário específicos
  /// (POST /api/consultations).
  ///
  /// O `paymentMethod` é exigido pela validação do backend, mas quem define
  /// a forma de pagamento de verdade é o checkout, depois — igual ao
  /// ScheduleWizard do site, que manda "PIX" aqui e sobrescreve lá.
  /// Responde 409 se outro paciente pegou o horário nesse meio-tempo.
  static Future<Consultation> scheduleConsultation({
    required String doctorId,
    required DateTime scheduledAt,
    required String chiefComplaint,
    String paymentMethod = 'PIX',
  }) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.post(
        '/api/consultations',
        data: {
          'doctorId': doctorId,
          // toUtc: sem o 'Z' o backend (Vercel, UTC) lia a hora local do celular
          // como UTC e a consulta ficava 3h antes do escolhido.
          'scheduledAt': scheduledAt.toUtc().toIso8601String(),
          'chiefComplaint': chiefComplaint,
          'paymentMethod': paymentMethod,
        },
      );
      return Consultation.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível agendar a consulta.');
    }
  }

  /// Gera a cobrança da consulta (POST /api/checkout).
  ///
  /// O valor NÃO vai no corpo: quem decide é o servidor, a partir do
  /// honorário do médico. Cartão exige os dados completos do cartão e não
  /// é oferecido no app — só Pix e boleto.
  static Future<PaymentInfo> checkout({
    required String consultationId,
    required String method,
  }) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.post(
        '/api/checkout',
        data: {'consultationId': consultationId, 'method': method},
      );
      return PaymentInfo.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível gerar a cobrança.');
    }
  }

  /// Confirma o pagamento sem passar pelo Asaas. Só existe quando o servidor
  /// roda com PAYMENT_MOCK=true; em produção responde 404.
  static Future<void> simulatePayment(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      await dio.post('/api/dev/simulate-payment', data: {'consultationId': consultationId});
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw const ConsultationFailure(
          'Simulação indisponível: o servidor está sem PAYMENT_MOCK=true.',
          statusCode: 404,
        );
      }
      throw _toFailure(e, fallback: 'Não foi possível simular o pagamento.');
    }
  }
}
