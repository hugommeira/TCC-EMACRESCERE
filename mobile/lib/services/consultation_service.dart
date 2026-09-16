import 'package:dio/dio.dart';

import '../models/consultation.dart';
import '../models/doctor.dart';
import 'api_client.dart';

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

  /// Agenda uma consulta com médico/horário específicos (POST
  /// /api/consultations) — diferente da fila on-demand (POST
  /// /api/queue/enter, ainda não implementada no app). O backend hoje
  /// aceita paymentMethod na validação mas não inicia cobrança de verdade
  /// pra consulta agendada (TODO(api) do próprio backend, não nosso).
  static Future<Consultation> scheduleConsultation({
    required String doctorId,
    required DateTime scheduledAt,
    required String chiefComplaint,
    required String paymentMethod,
  }) async {
    final dio = await ApiClient.instance;
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
  }
}
