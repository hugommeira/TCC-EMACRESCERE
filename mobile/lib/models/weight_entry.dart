/// Uma pesagem vinda do backend (GET /api/weight).
///
/// Antes isto era um registro local, guardado em SharedPreferences. Agora
/// cada pesagem é uma linha de `weight_records` no banco: o médico enxerga,
/// o site enxerga, e o dado sobrevive a reinstalar o app.
class WeightEntry {
  const WeightEntry({
    required this.id,
    required this.date,
    required this.weightKg,
    this.note,
    this.source = 'PATIENT',
    this.recordedBy,
    this.bmi,
    this.bmiLabel,
    this.bmiCategory,
  });

  final String id;
  final DateTime date;
  final double weightKg;
  final String? note;

  /// 'PATIENT' (o próprio paciente) ou 'DOCTOR' (aferido na consulta).
  final String source;

  /// Nome de quem registrou, quando não foi o próprio paciente.
  final String? recordedBy;

  /// IMC calculado pelo servidor (null quando falta a altura no perfil).
  ///
  /// Valor, rótulo e faixa vêm todos prontos de lib/bmi.ts. O app não
  /// classifica nada por conta própria: se classificasse, bastaria mudar
  /// uma faixa no site para app e site mostrarem categorias diferentes
  /// para o mesmo peso.
  final double? bmi;
  final String? bmiLabel;
  final BmiCategory? bmiCategory;

  bool get registradoPeloMedico => source == 'DOCTOR';

  factory WeightEntry.fromJson(Map<String, dynamic> json) {
    final bmiJson = json['bmi'] as Map<String, dynamic>?;
    return WeightEntry(
      id: json['id'] as String,
      date: DateTime.parse(json['measuredAt'] as String).toLocal(),
      weightKg: (json['weightKg'] as num).toDouble(),
      note: json['note'] as String?,
      source: (json['source'] as String?) ?? 'PATIENT',
      recordedBy: json['recordedBy'] as String?,
      bmi: bmiJson == null ? null : (bmiJson['value'] as num).toDouble(),
      bmiLabel: bmiJson?['label'] as String?,
      bmiCategory: bmiCategoryFromKey(bmiJson?['category'] as String?),
    );
  }
}

/// Números do topo da aba Peso, calculados pelo servidor.
class WeightSummary {
  const WeightSummary({
    this.heightCm,
    this.goalWeightKg,
    this.healthyCeilingKg,
    this.deltaKg,
    this.lastChangeKg,
    this.count = 0,
  });

  final double? heightCm;
  final double? goalWeightKg;

  /// Topo da faixa de peso normal (IMC 24,9) para a altura — sugestão de meta.
  final double? healthyCeilingKg;

  final double? deltaKg;
  final double? lastChangeKg;
  final int count;

  factory WeightSummary.fromJson(Map<String, dynamic> json) => WeightSummary(
        heightCm: (json['heightCm'] as num?)?.toDouble(),
        goalWeightKg: (json['goalWeightKg'] as num?)?.toDouble(),
        healthyCeilingKg: (json['healthyCeilingKg'] as num?)?.toDouble(),
        deltaKg: (json['deltaKg'] as num?)?.toDouble(),
        lastChangeKg: (json['lastChangeKg'] as num?)?.toDouble(),
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}

class WeightHistory {
  const WeightHistory({required this.summary, required this.entries});

  final WeightSummary summary;
  final List<WeightEntry> entries;

  bool get isEmpty => entries.isEmpty;
  WeightEntry? get latest => entries.isEmpty ? null : entries.last;
}

/// Filtro de período do gráfico — os mesmos do site.
enum WeightRange { d30, d90, d180, d365, all }

extension WeightRangeInfo on WeightRange {
  String get label => switch (this) {
        WeightRange.d30 => '30 dias',
        WeightRange.d90 => '3 meses',
        WeightRange.d180 => '6 meses',
        WeightRange.d365 => '1 ano',
        WeightRange.all => 'Tudo',
      };

  /// Null = histórico inteiro.
  int? get days => switch (this) {
        WeightRange.d30 => 30,
        WeightRange.d90 => 90,
        WeightRange.d180 => 180,
        WeightRange.d365 => 365,
        WeightRange.all => null,
      };
}

/// O que o gráfico mostra. Nunca os dois ao mesmo tempo: dois eixos num
/// gráfico só confundem mais do que informam.
enum WeightMetric { weight, bmi }

enum BmiCategory {
  underweight,
  normal,
  overweight,
  obeseClass1,
  obeseClass2,
  obeseClass3,
}

extension BmiCategoryLabel on BmiCategory {
  String get label => switch (this) {
        BmiCategory.underweight => 'Abaixo do peso',
        BmiCategory.normal => 'Peso normal',
        BmiCategory.overweight => 'Sobrepeso',
        BmiCategory.obeseClass1 => 'Obesidade grau I',
        BmiCategory.obeseClass2 => 'Obesidade grau II',
        BmiCategory.obeseClass3 => 'Obesidade grau III',
      };
}

/// Converte a chave que o servidor manda (BMI_CATEGORIES em lib/bmi.ts) na
/// faixa do app. Serve só para escolher a cor do selo — o texto exibido é o
/// `label` que veio junto.
///
/// Chave desconhecida (uma faixa nova criada no site antes de atualizar o
/// app) devolve null: o selo fica sem cor própria em vez de o app quebrar.
BmiCategory? bmiCategoryFromKey(String? key) => switch (key) {
      'UNDERWEIGHT' => BmiCategory.underweight,
      'NORMAL' => BmiCategory.normal,
      'OVERWEIGHT' => BmiCategory.overweight,
      'OBESE_1' => BmiCategory.obeseClass1,
      'OBESE_2' => BmiCategory.obeseClass2,
      'OBESE_3' => BmiCategory.obeseClass3,
      _ => null,
    };
