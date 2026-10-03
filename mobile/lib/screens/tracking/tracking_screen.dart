import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../services/auth_service.dart';
import '../../services/weight_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/curved_header_scaffold.dart';
import '../../widgets/quick_action_button.dart';
import '../shell/main_shell.dart';
import '../shell/tab_visibility.dart';
import 'register_weight_sheet.dart';
import 'set_goal_sheet.dart';
import 'weight_chart.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen>
    with TabVisibilityMixin<TrackingScreen> {
  SessionUser? _user;
  WeightHistory? _history;
  bool _loading = true;
  String? _erro;

  WeightRange _range = WeightRange.d90;
  WeightMetric _metric = WeightMetric.weight;

  @override
  ShellTab get tab => ShellTab.tracking;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Chamado pelo TabVisibilityMixin quando a aba volta a aparecer — o
  /// médico pode ter registrado uma pesagem durante a consulta.
  @override
  void onTabShown() => _load();

  Future<void> _load() async {
    if (mounted) {
      setState(() {
        _loading = _history == null;
        _erro = null;
      });
    }
    try {
      final user = await AuthService.checkSession();
      final history = await WeightService.getHistory();
      if (!mounted) return;
      setState(() {
        _user = user;
        _history = history;
        _loading = false;
      });
    } on WeightFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.message;
        _loading = false;
      });
    }
  }

  List<WeightEntry> get _entriesDoPeriodo {
    final todas = _history?.entries ?? const <WeightEntry>[];
    final dias = _range.days;
    if (dias == null) return todas;
    final corte = DateTime.now().subtract(Duration(days: dias));
    return todas.where((e) => e.date.isAfter(corte)).toList();
  }

  Future<void> _openRegisterWeight() async {
    final saved = await RegisterWeightSheet.show(
      context,
      hasHeight: _history?.summary.heightCm != null,
    );
    if (saved == true) await _load();
  }

  Future<void> _openSetGoal() async {
    final resumo = _history?.summary;
    final saved = await SetGoalSheet.show(
      context,
      currentGoalKg: resumo?.goalWeightKg,
      currentHeightCm: resumo?.heightCm,
      sugestaoKg: resumo?.healthyCeilingKg,
    );
    if (saved == true) await _load();
  }

  /// Apaga uma pesagem do próprio paciente (DELETE /api/weight/:id).
  ///
  /// Serve para o caso banal de digitar 87 no lugar de 78: sem isso, o erro
  /// fica no gráfico para sempre. Só aparece nas pesagens que o paciente
  /// registrou — quem apaga uma aferição do médico é o médico, e o backend
  /// recusa de qualquer jeito.
  Future<void> _apagarPesagem(WeightEntry entry) async {
    final dia = '${entry.date.day.toString().padLeft(2, '0')}/'
        '${entry.date.month.toString().padLeft(2, '0')}/${entry.date.year}';
    final confirmou = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Apagar pesagem?'),
        content: Text('${entry.weightKg.toStringAsFixed(1)} kg em $dia.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Apagar'),
          ),
        ],
      ),
    );
    if (confirmou != true) return;

    try {
      await WeightService.deleteEntry(entry.id);
      await _load();
    } on WeightFailure catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final erro = _erro;
    if (erro != null && _history == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 40, color: AppColors.gray400),
                const SizedBox(height: 12),
                Text(erro, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(onPressed: _load, child: const Text('Tentar de novo')),
              ],
            ),
          ),
        ),
      );
    }

    final history = _history;
    final latest = history?.latest;
    final resumo = history?.summary;
    final entries = _entriesDoPeriodo;

    return CurvedHeaderScaffold(
      user: _user,
      onRefresh: _load,
      overlapCard: _SummaryCard(latest: latest),
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
                icon: Icons.straighten_rounded,
                label: 'Altura e meta',
                onTap: _openSetGoal,
              ),
            ),
          ],
        ),

        if (resumo?.heightCm == null) ...[
          const SizedBox(height: 16),
          Card(
            color: AppColors.brand50,
            child: ListTile(
              leading: const Icon(Icons.info_outline, color: AppColors.brand700),
              title: const Text('Falta a sua altura'),
              subtitle: const Text('Sem ela o IMC não pode ser calculado.'),
              trailing: TextButton(onPressed: _openSetGoal, child: const Text('Informar')),
            ),
          ),
        ],

        if (latest == null) ...[
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Comece agora', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  const Text(
                    'Registre a sua primeira pesagem. O histórico fica salvo na sua '
                    'conta e o seu médico enxerga durante a consulta.',
                    style: TextStyle(color: AppColors.gray600),
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          const SizedBox(height: 20),
          _FiltersRow(
            range: _range,
            metric: _metric,
            temAltura: resumo?.heightCm != null,
            onRange: (r) => setState(() { _range = r; }),
            onMetric: (m) => setState(() { _metric = m; }),
          ),
          const SizedBox(height: 12),
          _ChartCard(
            entries: entries,
            metric: _metric,
            goalKg: resumo?.goalWeightKg,
            periodo: _range.label,
          ),
          const SizedBox(height: 20),
          _GoalCard(
            latest: latest,
            goalKg: resumo?.goalWeightKg,
            sugestaoKg: resumo?.healthyCeilingKg,
            onSetGoal: _openSetGoal,
          ),
          const SizedBox(height: 20),
          _HistoryCard(entries: entries, onDelete: _apagarPesagem),
        ],
      ],
    );
  }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

class _FiltersRow extends StatelessWidget {
  const _FiltersRow({
    required this.range,
    required this.metric,
    required this.temAltura,
    required this.onRange,
    required this.onMetric,
  });

  final WeightRange range;
  final WeightMetric metric;
  final bool temAltura;
  final ValueChanged<WeightRange> onRange;
  final ValueChanged<WeightMetric> onMetric;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (final r in WeightRange.values)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(r.label),
                    selected: range == r,
                    onSelected: (_) => onRange(r),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            ChoiceChip(
              label: const Text('Peso'),
              selected: metric == WeightMetric.weight,
              onSelected: (_) => onMetric(WeightMetric.weight),
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('IMC'),
              selected: metric == WeightMetric.bmi,
              onSelected: temAltura ? (_) => onMetric(WeightMetric.bmi) : null,
            ),
          ],
        ),
      ],
    );
  }
}

// ─── Cartões ──────────────────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.latest});

  final WeightEntry? latest;

  @override
  Widget build(BuildContext context) {
    final atual = latest;
    if (atual == null) {
      return Card(
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

    final bmi = atual.bmi;
    final categoria = atual.bmiCategory;

    return Card(
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
                    '${atual.weightKg.toStringAsFixed(1)} kg',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  if (atual.registradoPeloMedico)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'aferido por ${atual.recordedBy ?? 'seu médico'}',
                        style: const TextStyle(fontSize: 12, color: AppColors.gray600),
                      ),
                    ),
                ],
              ),
            ),
            if (bmi != null)
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
                  if (atual.bmiLabel != null || categoria != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _categoryColor(categoria).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        atual.bmiLabel ?? categoria!.label,
                        style: TextStyle(
                          color: _categoryColor(categoria),
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

  /// Cor do selo da faixa de IMC. Faixa desconhecida (o site criou uma que
  /// esta versão do app não conhece) cai no cinza em vez de sumir com o selo.
  Color _categoryColor(BmiCategory? category) {
    return switch (category) {
      BmiCategory.normal => AppColors.success500,
      BmiCategory.underweight || BmiCategory.overweight => AppColors.warning500,
      BmiCategory.obeseClass1 ||
      BmiCategory.obeseClass2 ||
      BmiCategory.obeseClass3 =>
        AppColors.danger500,
      null => AppColors.gray600,
    };
  }
}

class _ChartCard extends StatelessWidget {
  const _ChartCard({
    required this.entries,
    required this.metric,
    required this.goalKg,
    required this.periodo,
  });

  final List<WeightEntry> entries;
  final WeightMetric metric;
  final double? goalKg;
  final String periodo;

  @override
  Widget build(BuildContext context) {
    final variacao = _variacao();

    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 20, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    metric == WeightMetric.weight ? 'Evolução do peso' : 'Evolução do IMC',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (variacao != null)
                  Text(
                    variacao,
                    style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.brand700),
                  ),
              ],
            ),
            Text(periodo, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: WeightChart(entries: entries, metric: metric, goalKg: goalKg),
            ),
          ],
        ),
      ),
    );
  }

  String? _variacao() {
    if (entries.length < 2) return null;
    final delta = metric == WeightMetric.weight
        ? entries.last.weightKg - entries.first.weightKg
        : (entries.last.bmi != null && entries.first.bmi != null
            ? entries.last.bmi! - entries.first.bmi!
            : null);
    if (delta == null) return null;
    final sinal = delta > 0 ? '+' : delta < 0 ? '−' : '';
    final unidade = metric == WeightMetric.weight ? ' kg' : '';
    return '$sinal${delta.abs().toStringAsFixed(1)}$unidade';
  }
}

class _GoalCard extends StatelessWidget {
  const _GoalCard({
    required this.latest,
    required this.goalKg,
    required this.sugestaoKg,
    required this.onSetGoal,
  });

  final WeightEntry latest;
  final double? goalKg;
  final double? sugestaoKg;
  final VoidCallback onSetGoal;

  @override
  Widget build(BuildContext context) {
    return Card(
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
                  Text(_mensagem(), style: const TextStyle(fontWeight: FontWeight.w600)),
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

  String _mensagem() {
    final meta = goalKg;
    if (meta == null) {
      final sugestao = sugestaoKg;
      return sugestao == null
          ? 'Nenhuma meta definida'
          : 'Nenhuma meta definida (sugestão: ${sugestao.toStringAsFixed(1)} kg)';
    }
    final diff = latest.weightKg - meta;
    if (diff.abs() < 0.1) return 'Meta atingida! (${meta.toStringAsFixed(1)} kg)';
    final direcao = diff > 0 ? 'perder' : 'ganhar';
    return 'Faltam ${diff.abs().toStringAsFixed(1)} kg pra $direcao '
        '(meta: ${meta.toStringAsFixed(1)} kg)';
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.entries, required this.onDelete});

  final List<WeightEntry> entries;
  final Future<void> Function(WeightEntry) onDelete;

  @override
  Widget build(BuildContext context) {
    final recentes = entries.reversed.take(8).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Histórico', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (recentes.isEmpty)
              const Text(
                'Nenhuma pesagem neste período.',
                style: TextStyle(color: AppColors.gray600),
              ),
            for (final e in recentes)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${e.date.day.toString().padLeft(2, '0')}/'
                            '${e.date.month.toString().padLeft(2, '0')}/${e.date.year}',
                            style: const TextStyle(color: AppColors.gray600),
                          ),
                          if (e.registradoPeloMedico)
                            Text(
                              'aferido por ${e.recordedBy ?? 'seu médico'}',
                              style: const TextStyle(fontSize: 11, color: AppColors.gray400),
                            ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${e.weightKg.toStringAsFixed(1)} kg',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        if (e.bmi != null)
                          Text(
                            'IMC ${e.bmi!.toStringAsFixed(1)}',
                            style: const TextStyle(fontSize: 11, color: AppColors.gray600),
                          ),
                      ],
                    ),
                    if (!e.registradoPeloMedico)
                      IconButton(
                        tooltip: 'Apagar pesagem',
                        visualDensity: VisualDensity.compact,
                        onPressed: () => onDelete(e),
                        icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.gray400),
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
