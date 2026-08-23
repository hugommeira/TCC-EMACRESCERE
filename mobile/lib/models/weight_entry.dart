class WeightEntry {
  const WeightEntry({required this.date, required this.weightKg});

  final DateTime date;
  final double weightKg;

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'weightKg': weightKg,
      };

  factory WeightEntry.fromJson(Map<String, dynamic> json) => WeightEntry(
        date: DateTime.parse(json['date'] as String),
        weightKg: (json['weightKg'] as num).toDouble(),
      );
}

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

/// Classificação padrão da OMS por faixa de IMC.
BmiCategory classifyBmi(double bmi) {
  if (bmi < 18.5) return BmiCategory.underweight;
  if (bmi < 25) return BmiCategory.normal;
  if (bmi < 30) return BmiCategory.overweight;
  if (bmi < 35) return BmiCategory.obeseClass1;
  if (bmi < 40) return BmiCategory.obeseClass2;
  return BmiCategory.obeseClass3;
}

double calculateBmi({required double weightKg, required double heightCm}) {
  final heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
