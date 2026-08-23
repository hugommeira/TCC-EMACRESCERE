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
