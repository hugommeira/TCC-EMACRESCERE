import 'api_client.dart';

/// Rótulos das medidas, os mesmos de lib/measures.ts do site. Os limites
/// (mínimo e máximo) ficam só no servidor, que devolve o erro do campo.
class MeasureDef {
  const MeasureDef(this.type, this.label, this.unit, this.hint);

  final String type;
  final String label;
  final String unit;

  /// Como medir (aparece no formulário).
  final String hint;
}

const kMeasures = [
  MeasureDef(
    'waist',
    'Cintura',
    'cm',
    'Fita na altura do umbigo, sem apertar, ao fim de uma expiração normal.',
  ),
  MeasureDef(
    'hip',
    'Quadril',
    'cm',
    'Fita na parte mais larga do quadril, em pé e com os pés juntos.',
  ),
  MeasureDef(
    'body_fat',
    'Gordura corporal',
    '%',
    'Valor da bioimpedância ou da avaliação feita pelo seu médico.',
  ),
  MeasureDef(
    'lean_mass',
    'Massa magra',
    'kg',
    'Valor da bioimpedância ou da avaliação feita pelo seu médico.',
  ),
];

class MeasurePoint {
  const MeasurePoint({
    required this.id,
    required this.value,
    required this.measuredAt,
    this.note,
    this.recordedBy,
    this.canDelete = false,
  });

  final String id;
  final double value;
  final DateTime measuredAt;
  final String? note;
  final String? recordedBy;

  /// O servidor diz quem pode apagar (quem registrou).
  final bool canDelete;

  factory MeasurePoint.fromJson(Map<String, dynamic> json) => MeasurePoint(
    id: json['id'] as String,
    value: (json['value'] as num).toDouble(),
    measuredAt: DateTime.parse(json['measuredAt'] as String),
    note: json['note'] as String?,
    recordedBy: json['recordedBy'] as String?,
    canDelete: json['canDelete'] == true,
  );
}

/// Séries por tipo e as relações já calculadas no servidor (RCEst, RCQ).
class MeasuresHistory {
  const MeasuresHistory({required this.series, this.waistToHeight, this.waistToHip, this.heightCm});

  final Map<String, List<MeasurePoint>> series;
  final double? waistToHeight;
  final double? waistToHip;
  final int? heightCm;

  factory MeasuresHistory.fromJson(Map<String, dynamic> json) {
    final raw = (json['series'] as Map?) ?? const {};
    final derived = (json['derived'] as Map?) ?? const {};
    return MeasuresHistory(
      series: {
        for (final m in kMeasures)
          m.type: ((raw[m.type] as List?) ?? const [])
              .map((e) => MeasurePoint.fromJson(e as Map<String, dynamic>))
              .toList(),
      },
      waistToHeight: (derived['waistToHeight'] as num?)?.toDouble(),
      waistToHip: (derived['waistToHip'] as num?)?.toDouble(),
      heightCm: (derived['heightCm'] as num?)?.toInt(),
    );
  }
}

/// Outras medidas do corpo (app/api/measurements). Só valores medidos: sem
/// metas, sequências ou lembretes, e sem conta nenhuma no app.
///   GET    /api/measurements[?patientId=]  -> { data: { series, derived } }
///   POST   /api/measurements               { type, value, note?, patientId?, consultationId? }
///   DELETE /api/measurements/{id}
class MeasuresService {
  MeasuresService._();

  static Future<MeasuresHistory> getHistory({String? patientId}) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/measurements', queryParameters: {'patientId': ?patientId});
    return MeasuresHistory.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  static Future<void> add({
    required String type,
    required Object value,
    String? note,
    String? patientId,
    String? consultationId,
  }) async {
    final dio = await ApiClient.instance;
    await dio.post(
      '/api/measurements',
      data: {
        'type': type,
        'value': value,
        if (note != null && note.isNotEmpty) 'note': note,
        'patientId': ?patientId,
        'consultationId': ?consultationId,
      },
    );
  }

  static Future<void> delete(String id) async {
    final dio = await ApiClient.instance;
    await dio.delete('/api/measurements/$id');
  }
}
