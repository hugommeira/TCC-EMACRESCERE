import '../models/weight_entry.dart';
import 'api_client.dart';
import 'api_error.dart';

/// Erro de negócio das rotas de peso, com mensagem legível.
class WeightFailure extends ApiError {
  const WeightFailure(
    String message, {
    int? statusCode,
    String code = 'ERRO_INTERNO',
    Map<String, List<String>> fieldErrors = const {},
  }) : super(code, message, statusCode: statusCode, fieldErrors: fieldErrors);

  /// Converte qualquer erro (Dio, resposta fora do formato, sem rede) com o
  /// código do catálogo; [fallback] só quando o servidor não mandou mensagem.
  factory WeightFailure.fromError(Object e, {required String fallback}) {
    final a = ApiError.from(e, fallback: fallback);
    return WeightFailure(a.message, statusCode: a.statusCode, code: a.code, fieldErrors: a.fieldErrors);
  }

  /// Mensagem do primeiro campo inválido (ex.: "O peso deve ser maior que…"),
  /// ou a mensagem geral.
  String get displayMessage => firstFieldError ?? message;
}

WeightFailure _toFailure(Object e, {required String fallback}) =>
    WeightFailure.fromError(e, fallback: fallback);

/// Acompanhamento de peso e IMC.
///
/// Contratos conferidos lendo o backend:
///   GET   /api/weight[?patientId=&range=]  -> { data: { summary, points[] } }
///   POST  /api/weight                      -> { data: ponto }
///   PATCH /api/patient/metrics             -> { data: { heightCm, goalWeightKg } }
///
/// O IMC vem calculado do servidor (lib/bmi.ts), a partir do peso e da
/// altura do perfil — o app não recalcula, pra não divergir do site.
class WeightService {
  WeightService._();

  /// Histórico completo. O filtro de período é aplicado na tela, para
  /// trocar de faixa não custar uma requisição.
  ///
  /// [patientId] só é usado pelo médico, olhando o paciente dele.
  static Future<WeightHistory> getHistory({String? patientId}) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.get(
        '/api/weight',
        queryParameters: {'patientId': ?patientId},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      final points = (data['points'] as List)
          .map((e) => WeightEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      return WeightHistory(
        summary: WeightSummary.fromJson(data['summary'] as Map<String, dynamic>),
        entries: points,
      );
    } catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível carregar o acompanhamento.');
    }
  }

  static Future<WeightEntry> addEntry({
    required double weightKg,
    DateTime? measuredAt,
    String? note,
    String? patientId,
    String? consultationId,
  }) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.post('/api/weight', data: {
        'weightKg': weightKg,
        // O servidor lê ISO sem fuso como UTC — convenção do projeto.
        'measuredAt': (measuredAt ?? DateTime.now()).toUtc().toIso8601String(),
        if (note != null && note.isNotEmpty) 'note': note,
        'patientId': ?patientId,
        'consultationId': ?consultationId,
      });
      return WeightEntry.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível registrar o peso.');
    }
  }

  static Future<void> deleteEntry(String id) async {
    final dio = await ApiClient.instance;
    try {
      await dio.delete('/api/weight/$id');
    } catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível apagar o registro.');
    }
  }

  /// Altura e meta ficam no perfil do paciente — é a altura que destrava o
  /// cálculo do IMC em todo o histórico.
  /// Manda só o que mudou. Para APAGAR a meta é preciso enviar null
  /// explicitamente — por isso [clearGoalWeight]: em Dart não dá para
  /// distinguir "não mexer" de "apagar" só pelo parâmetro nulo, e antes
  /// limpar o campo na tela simplesmente não fazia nada.
  static Future<WeightSummary> updateMetrics({
    double? heightCm,
    double? goalWeightKg,
    bool clearGoalWeight = false,
  }) async {
    final dio = await ApiClient.instance;
    final data = <String, dynamic>{};
    if (heightCm != null) data['heightCm'] = heightCm.round();
    if (clearGoalWeight) {
      data['goalWeightKg'] = null;
    } else if (goalWeightKg != null) {
      data['goalWeightKg'] = goalWeightKg;
    }
    try {
      final response = await dio.patch('/api/patient/metrics', data: data);
      return WeightSummary.fromJson(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      throw _toFailure(e, fallback: 'Não foi possível salvar.');
    }
  }
}
