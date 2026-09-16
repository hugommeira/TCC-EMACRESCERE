import 'package:dio/dio.dart';

import '../models/payment.dart';
import 'api_client.dart';

/// Resultado de POST /api/queue/enter: a consulta criada (SCHEDULED até o
/// pagamento confirmar) e a cobrança gerada no Asaas.
class QueueEntry {
  const QueueEntry({required this.consultationId, required this.payment});

  final String consultationId;
  final PaymentInfo payment;
}

/// GET /api/queue/position?id=...
class QueuePosition {
  const QueuePosition({
    required this.status,
    required this.position,
    required this.ahead,
    required this.doctorId,
  });

  /// Status da consulta (SCHEDULED = aguardando pagamento, WAITING = na
  /// fila, IN_PROGRESS = médico pegou, COMPLETED/CANCELLED/NO_SHOW).
  final String status;
  final int? position;
  final int ahead;
  final String? doctorId;

  bool get isWaiting => status == 'WAITING';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isAwaitingPayment => status == 'SCHEDULED';
  bool get isOver => status == 'COMPLETED' || status == 'CANCELLED' || status == 'NO_SHOW';

  factory QueuePosition.fromJson(Map<String, dynamic> json) => QueuePosition(
        status: json['status'] as String,
        position: json['position'] as int?,
        ahead: json['ahead'] as int? ?? 0,
        doctorId: json['doctorId'] as String?,
      );
}

/// Erro de negócio devolvido pelo backend com mensagem legível (409 quando
/// já existe consulta ativa, 422 de validação etc.).
class QueueFailure implements Exception {
  const QueueFailure(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

/// Fila de atendimento on-demand. Contrato confirmado lendo
/// app/api/queue/* e app/api/dev/simulate-payment do backend.
///
/// Fluxo: enter() cria a consulta + cobrança -> paciente paga (Pix/boleto)
/// -> webhook do Asaas (ou simulatePayment em modo teste) muda pra WAITING
/// -> app faz polling de getPosition() + heartbeat() a cada ~20s -> médico
/// pega (IN_PROGRESS) -> app abre a sala da consulta.
class QueueService {
  QueueService._();

  static Future<QueueEntry> enter({
    required String chiefComplaint,
    required String method,
  }) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.post(
        '/api/queue/enter',
        data: {'chiefComplaint': chiefComplaint, 'method': method},
      );
      final data = response.data as Map<String, dynamic>;
      return QueueEntry(
        consultationId: (data['consultation'] as Map<String, dynamic>)['id'] as String,
        payment: PaymentInfo.fromJson(data['payment'] as Map<String, dynamic>),
      );
    } on DioException catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível entrar na fila.');
    }
  }

  static Future<QueuePosition> getPosition(String consultationId) async {
    final dio = await ApiClient.instance;
    final response = await dio.get(
      '/api/queue/position',
      queryParameters: {'id': consultationId},
    );
    return QueuePosition.fromJson(response.data as Map<String, dynamic>);
  }

  /// Mantém a presença do paciente na fila; sem isso o backend considera
  /// abandono depois de um tempo.
  static Future<void> heartbeat(String consultationId) async {
    final dio = await ApiClient.instance;
    await dio.post('/api/queue/heartbeat', data: {'consultationId': consultationId});
  }

  /// Só existe quando o servidor roda com PAYMENT_MOCK=true; caso
  /// contrário responde 404 "Not found".
  static Future<void> simulatePayment(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      await dio.post('/api/dev/simulate-payment', data: {'consultationId': consultationId});
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        throw const QueueFailure(
          'Simulação indisponível: o servidor está sem PAYMENT_MOCK=true.',
          statusCode: 404,
        );
      }
      throw _toFailure(e, fallback: 'Não foi possível simular o pagamento.');
    }
  }

  static QueueFailure _toFailure(DioException e, {required String fallback}) {
    final data = e.response?.data;
    final message = data is Map ? data['message'] as String? : null;
    return QueueFailure(message ?? fallback, statusCode: e.response?.statusCode);
  }
}
