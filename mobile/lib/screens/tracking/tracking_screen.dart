import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../services/auth_service.dart';
import '../../services/weight_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/curved_header_scaffold.dart';
import '../../widgets/quick_action_button.dart';
import 'register_weight_sheet.dart';
import 'set_goal_sheet.dart';
import 'weight_chart.dart';

const _kSummaryCardHeight = 150.0;

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  SessionUser? _user;
  List<WeightEntry> _entries = [];
  double? _heightCm;
  double? _goalKg;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = await AuthService.checkSession();
    final entries = await WeightService.getEntries();
    final height = await WeightService.getHeightCm();
    final goal = await WeightService.getGoalKg();
    if (!mounted) return;
    setState(() {
      _user = user;
      _entries = entries;
      _heightCm = height;
      _goalKg = goal;
      _loading = false;
    });
  }

  Future<void> _openRegisterWeight() async {
    final saved = await RegisterWeightSheet.show(context, hasHeight: _heightCm != null);
    if (saved == true) await _load();
  }

  Future<void> _openSetGoal() async {
    final saved = await SetGoalSheet.show(context, currentGoalKg: _goalKg);
    if (saved == true) await _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final latest = _entries.isEmpty ? null : _entries.last;

    return CurvedHeaderScaffold(
      user: _user,
      overlapCard: _SummaryCard(latest: latest, heightCm: _heightCm),
      overlapCardHeight: _kSummaryCardHeight,
      children: [
        Row(
          children: [
            Expanded(
              child: QuickActionButton(
                icon: Icons.add_circle_outline,
                label: 'Registrar peso',
                onTap: _openRegisterWeight,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: QuickActionButton(
                icon: Icons.flag_outlined,
                label: 'Definir meta',
                onTap: _openSetGoal,
              ),
            ),
          ],
        ),
        if (latest != null) ...[
          const SizedBox(height: 20),
          if (_entries.length >= 2) ...[
            _ChartCard(entries: _entries),
            const SizedBox(height: 20),
          ],
          _GoalCard(latest: latest, goalKg: _goalKg, onSetGoal: _openSetGoal),
          const SizedBox(height: 20),
          _HistoryCard(entries: _entries),
        ],
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.latest, required this.heightCm});

  final WeightEntry? latest;
  final double? heightCm;

  @override
  Widget build(BuildContext context) {
    if (latest == null) {
      return Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              const Icon(Icons.monitor_weight_outlined, size: 32, color: AppColors.gray300),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Você ainda não registrou nenhum peso',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final bmi = heightCm != null
        ? calculateBmi(weightKg: latest!.weightKg, heightCm: heightCm!)
        : null;
    final category = bmi != null ? classifyBmi(bmi) : null;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Peso atual', style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: 4),
                  Text(
                    '${latest!.weightKg.toStringAsFixed(1)} kg',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
            if (bmi != null && category != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('IMC', style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: 4),
                  Text(
                    bmi.toStringAsFixed(1),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _categoryColor(category).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      category.label,
                      style: TextStyle(
                        color: _categoryColor(category),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Color _categoryColor(BmiCategory category) {
    return switch (category) {
      BmiCategory.normal => AppColors.success500,
      BmiCategory.underweight || BmiCategory.overweight => AppColors.warning500,
      BmiCategory.obeseClass1 ||
      BmiCategory.obeseClass2 ||
      BmiCategory.obeseClass3 =>
        AppColors.danger500,
    };
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({required this.entries});

  final List<WeightEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 20, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Evolução do peso', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            SizedBox(height: 200, child: WeightChart(entries: entries)),
          ],
        ),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.latest, required this.goalKg, required this.onSetGoal});

  final WeightEntry latest;
  final double? goalKg;
  final VoidCallback onSetGoal;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.brand100,
              child: Icon(Icons.flag_outlined, color: AppColors.brand700),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Meta de peso', style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: 4),
                  Text(
                    goalKg == null ? 'Nenhuma meta definida' : _goalMessage(),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: SizedBox(
                      height: 36,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          textStyle: const TextStyle(fontSize: 13),
                        ),
                        onPressed: onSetGoal,
                        child: Text(goalKg == null ? 'Definir' : 'Editar'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _goalMessage() {
    final diff = latest.weightKg - goalKg!;
    if (diff.abs() < 0.1) return 'Meta atingida! (${goalKg!.toStringAsFixed(1)} kg)';
    final direction = diff > 0 ? 'perder' : 'ganhar';
    return 'Faltam ${diff.abs().toStringAsFixed(1)} kg pra $direction (meta: ${goalKg!.toStringAsFixed(1)} kg)';
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.entries});

  final List<WeightEntry> entries;

  @override
  Widget build(BuildContext context) {
    final recent = entries.reversed.take(5).toList();

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Histórico recente', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final entry in recent)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${entry.date.day}/${entry.date.month}/${entry.date.year}',
                      style: const TextStyle(color: AppColors.gray600),
                    ),
                    Text(
                      '${entry.weightKg.toStringAsFixed(1)} kg',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
