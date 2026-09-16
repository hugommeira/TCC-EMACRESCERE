import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/weight_entry.dart';

/// Persistência local temporária dos registros de peso, altura e meta.
///
/// TODO(api): substituir por chamadas ao backend quando existir um
/// endpoint de acompanhamento de peso — hoje o Next.js não tem nenhum
/// model/rota pra isso (só existe FollowUp, que é sobre mensagens
/// pós-consulta, não métricas). Ver CLAUDE.md.
class WeightService {
  WeightService._();

  static const _entriesKey = 'weight_entries';
  static const _heightKey = 'height_cm';
  static const _goalKey = 'weight_goal_kg';

  static Future<List<WeightEntry>> getEntries() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_entriesKey);
    if (raw == null || raw.isEmpty) return [];

    final list = jsonDecode(raw) as List;
    final entries = list
        .map((e) => WeightEntry.fromJson(e as Map<String, dynamic>))
        .toList();
    entries.sort((a, b) => a.date.compareTo(b.date));
    return entries;
  }

  static Future<void> addEntry(WeightEntry entry) async {
    final entries = await getEntries();
    entries.add(entry);
    await _saveEntries(entries);
  }

  static Future<void> _saveEntries(List<WeightEntry> entries) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = jsonEncode(entries.map((e) => e.toJson()).toList());
    await prefs.setString(_entriesKey, raw);
  }

  /// Dados de EXEMPLO pra demonstração (trabalho de escola): 10 semanas de
  /// evolução, altura e meta. Só é oferecido quando não há nenhum registro,
  /// e o usuário precisa pedir explicitamente (botão na aba Peso).
  static Future<void> loadDemoData() async {
    final today = DateTime.now();
    final start = DateTime(today.year, today.month, today.day).subtract(const Duration(days: 63));
    const weights = [84.6, 83.9, 83.1, 82.8, 81.9, 81.2, 80.4, 80.0, 79.3, 78.6];
    final entries = <WeightEntry>[
      for (var i = 0; i < weights.length; i++)
        WeightEntry(date: start.add(Duration(days: 7 * i)), weightKg: weights[i]),
    ];
    await _saveEntries(entries);
    await setHeightCm(168);
    await setGoalKg(72);
  }

  static Future<double?> getHeightCm() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getDouble(_heightKey);
  }

  static Future<void> setHeightCm(double heightCm) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_heightKey, heightCm);
  }

  static Future<double?> getGoalKg() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getDouble(_goalKey);
  }

  static Future<void> setGoalKg(double goalKg) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_goalKey, goalKg);
  }
}
