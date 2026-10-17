import 'package:emacrescere_app/services/measures_service.dart';
import 'package:flutter_test/flutter_test.dart';

/// GET /api/measurements: o app lê séries e relações prontas do servidor.
void main() {
  test('lê séries por tipo e as relações calculadas no servidor', () {
    final h = MeasuresHistory.fromJson({
      'series': {
        'waist': [
          {
            'id': 'm1',
            'value': 92.5,
            'measuredAt': '2026-10-10T12:00:00.000Z',
            'note': null,
            'source': 'PATIENT',
            'recordedBy': 'Mariana',
            'canDelete': true,
          },
        ],
        'hip': [],
      },
      'derived': {'heightCm': 165, 'waistToHeight': 0.56, 'waistToHip': null},
    });
    expect(h.series['waist']!.single.value, 92.5);
    expect(h.series['waist']!.single.canDelete, isTrue);
    expect(h.series['body_fat'], isEmpty);
    expect(h.waistToHeight, 0.56);
    expect(h.waistToHip, isNull);
    expect(h.heightCm, 165);
  });

  test('os quatro tipos do site, na mesma ordem', () {
    expect(kMeasures.map((m) => m.type), ['waist', 'hip', 'body_fat', 'lean_mass']);
  });
}
