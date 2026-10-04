import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../services/weight_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/motion.dart';
import '../../widgets/ui.dart';
import '../shell/main_shell.dart';
import '../shell/tab_visibility.dart';
import 'register_weight_sheet.dart';
import 'set_goal_sheet.dart';

/// Prancheta "3 · Peso e IMC": anel de progresso até a meta, gráfico com
/// período e o histórico. Dados de GET /api/weight; o IMC e a faixa vêm
/// prontos do servidor (lib/bmi.ts) — o app não recalcula.
class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> with TabVisibilityMixin<TrackingScreen> {
  WeightHistory? _history;
  bool _loading = true;
  String? _erro;

  WeightRange _range = WeightRange.d90;

  /// As opções da prancheta (o "1 ano" saiu para caber em uma linha).
  static const _ranges = [WeightRange.d30, WeightRange.d90, WeightRange.d180, WeightRange.all];

  static const _rangeNames = {
    WeightRange.d30: 'últimos 30 dias',
    WeightRange.d90: 'últimos 3 meses',
    WeightRange.d180: 'últimos 6 meses',
    WeightRange.all: 'todo o histórico',
  };

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
      final history = await WeightService.getHistory();
      if (!mounted) return;
      setState(() {
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
    final saved = await RegisterWeightSheet.show(context, hasHeight: _history?.summary.heightCm != null);
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
  /// fica no gráfico para sempre. Só vale nas pesagens que o paciente
  /// registrou — quem apaga uma aferição do médico é o médico, e o backend
  /// recusa de qualquer jeito.
  Future<bool> _apagarPesagem(WeightEntry entry) async {
    final confirmou = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Apagar pesagem?'),
        content: Text('${formatDecimal(entry.weightKg)} kg em ${formatDate(entry.date)}.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Apagar')),
        ],
      ),
    );
    if (confirmou != true) return false;

    try {
      await WeightService.deleteEntry(entry.id);
      await _load();
      return true;
    } on WeightFailure catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final bottom = MediaQuery.paddingOf(context).bottom;

    Widget body;
    if (_loading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_erro != null && _history == null) {
      body = Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_rounded, size: 40, color: ds.muted),
              const SizedBox(height: 12),
              Text(_erro!, textAlign: TextAlign.center, style: TextStyle(color: ds.text)),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Tentar de novo')),
            ],
          ),
        ),
      );
    } else {
      final history = _history!;
      final entries = _entriesDoPeriodo;
      body = RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(18, 16, 18, 24 + bottom),
          children: [
            Rise(child: _GoalRingCard(history: history, onTap: _openSetGoal)),
            if (history.summary.heightCm == null) ...[
              const SizedBox(height: 14),
              DsCard(
                color: ds.tint,
                onTap: _openSetGoal,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.straighten_rounded, color: ds.link),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Informe sua altura para o IMC ser calculado.',
                        style: TextStyle(fontFamily: AppType.sans, color: ds.text, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: ds.link),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            if (history.isEmpty)
              Rise(
                delay: const Duration(milliseconds: 80),
                child: DsCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Comece agora', style: AppType.title(22, ds.title)),
                      const SizedBox(height: 6),
                      Text(
                        'Registre a sua primeira pesagem. O histórico fica salvo na sua '
                        'conta e o seu médico enxerga durante a consulta.',
                        style: TextStyle(fontFamily: AppType.sans, fontSize: 14, height: 1.45, color: ds.muted),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              Rise(
                delay: const Duration(milliseconds: 80),
                child: DsCard(
                  radius: 26,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      PillSegmented<WeightRange>(
                        options: [for (final r in _ranges) PillOption(r, r == WeightRange.all ? 'Tudo' : r.label)],
                        value: _range,
                        onChanged: (r) => setState(() { _range = r; }),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Evolução · ${_rangeNames[_range]}',
                              style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
                            ),
                          ),
                          if (entries.length >= 2)
                            Text(
                              _signedKg(entries.last.weightKg - entries.first.weightKg),
                              style: TextStyle(
                                fontFamily: AppType.sans,
                                fontWeight: FontWeight.w700,
                                color: ds.link,
                                fontFeatures: const [FontFeature.tabularFigures()],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 150,
                        child: entries.isEmpty
                            ? Center(
                                child: Text(
                                  'Nenhuma pesagem neste período.',
                                  style: TextStyle(fontFamily: AppType.sans, color: ds.muted),
                                ),
                              )
                            : _WeightLineChart(key: ValueKey(_range), entries: entries),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Rise(
                delay: const Duration(milliseconds: 160),
                child: _HistoryCard(entries: entries, onDelete: _apagarPesagem),
              ),
            ],
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: ds.bg,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 24, 22, 0),
              child: Row(
                children: [
                  Expanded(child: Text('Seu peso', style: AppType.title(30, ds.title))),
                  const ThemeToggle(),
                  const SizedBox(width: 10),
                  PressScale(
                    child: Material(
                      color: AppColors.brand700,
                      shape: const StadiumBorder(),
                      child: InkWell(
                        onTap: _openRegisterWeight,
                        customBorder: const StadiumBorder(),
                        child: const SizedBox(
                          height: 44,
                          child: Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.add_rounded, color: Colors.white, size: 18),
                                SizedBox(width: 6),
                                Text(
                                  'Registrar',
                                  style: TextStyle(
                                    fontFamily: AppType.sans,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: body),
          ],
        ),
      ),
    );
  }
}

String _signedKg(double v) => '${v <= 0 ? '−' : '+'}${formatDecimal(v.abs())} kg';

/// Cor do selo da faixa de IMC. Faixa desconhecida (o site criou uma que
/// esta versão do app não conhece) cai no cinza em vez de sumir com o selo.
(Color, Color) _bmiChipColors(BuildContext context, BmiCategory? category) {
  final c = context.colors;
  final ds = context.ds;
  return switch (category) {
    BmiCategory.normal => (ds.tint, ds.link),
    BmiCategory.underweight || BmiCategory.overweight || BmiCategory.obeseClass1 => (c.warningBg, c.warningFg),
    BmiCategory.obeseClass2 || BmiCategory.obeseClass3 => (c.dangerBg, c.danger600),
    null => (c.gray100, c.gray600),
  };
}

/// Cartão do anel: quanto do caminho até a meta já foi feito.
class _GoalRingCard extends StatelessWidget {
  const _GoalRingCard({required this.history, required this.onTap});

  final WeightHistory history;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final latest = history.latest;
    final goal = history.summary.goalWeightKg;
    final start = history.entries.isEmpty ? null : history.entries.first.weightKg;

    double? progress;
    if (latest != null && goal != null && start != null && (start - goal).abs() > 0.05) {
      progress = ((start - latest.weightKg) / (start - goal)).clamp(0.0, 1.0);
    }

    String falta;
    if (latest == null) {
      falta = 'Registre sua primeira pesagem';
    } else if (goal == null) {
      falta = 'Toque para definir sua meta';
    } else {
      final diff = latest.weightKg - goal;
      falta = diff.abs() < 0.1
          ? 'Meta de ${formatDecimal(goal)} kg atingida!'
          : 'Faltam ${formatDecimal(diff.abs())} kg para ${formatDecimal(goal)} kg';
    }

    final (chipBg, chipFg) = _bmiChipColors(context, latest?.bmiCategory);

    return DsCard(
      radius: 26,
      shadow: true,
      onTap: onTap,
      child: Row(
        children: [
          _GoalRing(progress: progress),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Peso atual', style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted)),
                const SizedBox(height: 6),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: latest == null ? '—' : formatDecimal(latest.weightKg)),
                      if (latest != null) TextSpan(text: ' kg', style: AppType.title(18, ds.title)),
                    ],
                  ),
                  style: AppType.title(34, ds.title, height: 1),
                ),
                if (latest?.bmi != null) ...[
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'IMC ${formatDecimal(latest!.bmi!)}',
                        style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
                      ),
                      DsChip(
                        label: latest.bmiLabel ?? latest.bmiCategory?.label ?? 'IMC',
                        bg: chipBg,
                        fg: chipFg,
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 6),
                Text(falta, style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Anel de 124 px: trilho, arco em degradê que se preenche ao abrir e um
/// pontilhado girando devagar por fora.
class _GoalRing extends StatefulWidget {
  const _GoalRing({required this.progress});

  final double? progress;

  @override
  State<_GoalRing> createState() => _GoalRingState();
}

class _GoalRingState extends State<_GoalRing> with SingleTickerProviderStateMixin {
  late final AnimationController _spin = AnimationController(vsync: this, duration: const Duration(seconds: 24));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _spin.stop();
    } else if (!_spin.isAnimating) {
      _spin.repeat();
    }
  }

  @override
  void dispose() {
    _spin.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final p = widget.progress;
    return SizedBox(
      width: 124,
      height: 124,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: reduceMotion(context) ? (p ?? 0) : 0, end: p ?? 0),
        duration: const Duration(milliseconds: 1600),
        curve: const Interval(0.18, 1, curve: Curves.easeOutCubic),
        builder: (context, value, _) => AnimatedBuilder(
          animation: _spin,
          builder: (context, _) => CustomPaint(
            painter: _RingPainter(progress: value, spin: _spin.value, track: ds.track, dash: ds.dash),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(p == null ? '—' : '${(value * 100).round()}%', style: AppType.title(26, ds.title, height: 1.1)),
                  Text(
                    p == null ? 'sem meta' : 'da meta',
                    style: TextStyle(fontFamily: AppType.sans, fontSize: 11, color: ds.muted),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.spin, required this.track, required this.dash});

  final double progress;
  final double spin;
  final Color track;
  final Color dash;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    // Pontilhado externo (r 60, traço 2 a cada 9), girando.
    final outer = Paint()
      ..color = dash
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    const r0 = 60.0;
    const step = 9 / r0;
    for (var a = 0.0; a < 2 * math.pi; a += step) {
      final s = a + spin * 2 * math.pi;
      canvas.drawArc(Rect.fromCircle(center: c, radius: r0), s, 2 / r0, false, outer);
    }
    const r = 52.0;
    final rect = Rect.fromCircle(center: c, radius: r);
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = track
        ..strokeWidth = 12
        ..style = PaintingStyle.stroke,
    );
    if (progress > 0) {
      canvas.drawArc(
        rect,
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        Paint()
          ..shader = const SweepGradient(
            startAngle: -math.pi / 2,
            endAngle: 3 * math.pi / 2,
            colors: [AppColors.brand600, AppColors.brand500, AppColors.leaf],
            stops: [0, 0.6, 1],
          ).createShader(rect)
          ..strokeWidth = 12
          ..strokeCap = StrokeCap.round
          ..style = PaintingStyle.stroke,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.spin != spin || old.track != track || old.dash != dash;
}

/// Gráfico da prancheta: 4 linhas de grade com rótulo à esquerda, área em
/// degradê, traço que se desenha e o último ponto em verde-folha.
class _WeightLineChart extends StatelessWidget {
  const _WeightLineChart({super.key, required this.entries});

  final List<WeightEntry> entries;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final still = reduceMotion(context);
    return Semantics(
      label: 'Gráfico: peso de ${formatDecimal(entries.first.weightKg)} kg para '
          '${formatDecimal(entries.last.weightKg)} kg no período',
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: still ? 1 : 0, end: 1),
        duration: const Duration(milliseconds: 2300),
        builder: (context, t, _) => CustomPaint(
          size: Size.infinite,
          painter: _LinePainter(
            entries: entries,
            draw: Curves.easeOutCubic.transform(((t - 0.17) / 0.78).clamp(0.0, 1.0)),
            pop: Curves.easeOutBack.transform(((t - 0.87) / 0.13).clamp(0.0, 1.0)),
            grid: ds.grid,
            axis: ds.axis,
            plot: ds.plot,
            dotFill: ds.dotFill,
          ),
        ),
      ),
    );
  }
}

class _LinePainter extends CustomPainter {
  _LinePainter({
    required this.entries,
    required this.draw,
    required this.pop,
    required this.grid,
    required this.axis,
    required this.plot,
    required this.dotFill,
  });

  final List<WeightEntry> entries;
  final double draw;
  final double pop;
  final Color grid, axis, plot, dotFill;

  void _label(Canvas canvas, String text, Offset at, {bool right = false}) {
    final tp = TextPainter(
      text: TextSpan(text: text, style: TextStyle(fontFamily: AppType.sans, fontSize: 10, color: axis)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(right ? at.dx - tp.width : at.dx, at.dy - tp.height));
  }

  @override
  void paint(Canvas canvas, Size size) {
    final ws = [for (final e in entries) e.weightKg];
    var lo = ws.reduce(math.min);
    var hi = ws.reduce(math.max);
    // Escala em números inteiros com folga, como os 93/91/89/87 da prancheta.
    lo = (lo - 0.5).floorToDouble();
    hi = (hi + 0.5).ceilToDouble();
    if (hi - lo < 3) hi = lo + 3;
    final stepKg = ((hi - lo) / 3).ceilToDouble();
    hi = lo + stepKg * 3;

    const left = 34.0;
    const top = 14.0;
    final bottom = size.height - 16;
    final right = size.width - 6;
    double y(double w) => top + (hi - w) / (hi - lo) * (bottom - top);

    final gridPaint = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (var i = 0; i <= 3; i++) {
      final gy = top + (bottom - top) * i / 3;
      canvas.drawLine(Offset(left - 4, gy), Offset(size.width, gy), gridPaint);
      _label(canvas, formatDecimal(hi - stepKg * i, 0), Offset(0, gy + 4));
    }

    final n = entries.length;
    final pts = <Offset>[
      for (var i = 0; i < n; i++) Offset(n == 1 ? (left + right) / 2 : left + (right - left) * i / (n - 1), y(ws[i])),
    ];

    if (n >= 2) {
      final line = Path()..moveTo(pts.first.dx, pts.first.dy);
      for (final p in pts.skip(1)) {
        line.lineTo(p.dx, p.dy);
      }
      final area = Path.from(line)
        ..lineTo(pts.last.dx, bottom)
        ..lineTo(pts.first.dx, bottom)
        ..close();
      canvas.drawPath(
        area,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.brand500.withValues(alpha: 0.28), AppColors.brand500.withValues(alpha: 0)],
          ).createShader(Rect.fromLTRB(0, top, size.width, bottom)),
      );
      final metric = line.computeMetrics().first;
      canvas.drawPath(
        metric.extractPath(0, metric.length * draw),
        Paint()
          ..color = plot
          ..strokeWidth = 3
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
      final fill = Paint()..color = dotFill;
      final ring = Paint()
        ..color = AppColors.brand500
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke;
      for (var i = 1; i < n - 1; i++) {
        if (i / (n - 1) > draw) break;
        canvas.drawCircle(pts[i], 3.5, fill);
        canvas.drawCircle(pts[i], 3.5, ring);
      }
    }

    if (pop > 0) {
      final last = pts.last;
      canvas.drawCircle(last, 7 * pop, Paint()..color = AppColors.leaf);
      canvas.drawCircle(
        last,
        7 * pop,
        Paint()
          ..color = AppColors.brand700
          ..strokeWidth = 3
          ..style = PaintingStyle.stroke,
      );
    }

    // Datas: primeira, do meio e última.
    String dm(DateTime d) => formatDate(d).substring(0, 5);
    _label(canvas, dm(entries.first.date), Offset(left - 4, size.height));
    if (n >= 3) {
      final mid = entries[n ~/ 2].date;
      final tp = TextPainter(
        text: TextSpan(text: dm(mid), style: TextStyle(fontFamily: AppType.sans, fontSize: 10, color: axis)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset((left + right) / 2 - tp.width / 2, size.height - tp.height));
    }
    if (n >= 2) _label(canvas, dm(entries.last.date), Offset(size.width, size.height), right: true);
  }

  @override
  bool shouldRepaint(_LinePainter old) =>
      old.draw != draw || old.pop != pop || old.entries != entries || old.plot != plot || old.grid != grid;
}

/// Últimas pesagens do período, da mais recente para a mais antiga.
class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.entries, required this.onDelete});

  final List<WeightEntry> entries;
  final Future<bool> Function(WeightEntry) onDelete;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final now = DateTime.now();
    final rows = <Widget>[];
    for (var i = entries.length - 1; i >= 0; i--) {
      final e = entries[i];
      final prev = i > 0 ? entries[i - 1] : null;
      final today = e.date.year == now.year && e.date.month == now.month && e.date.day == now.day;
      final label = e.registradoPeloMedico
          ? 'Aferido por ${e.recordedBy == null || e.recordedBy!.isEmpty ? 'seu médico' : e.recordedBy}'
          : today
              ? 'Hoje'
              : 'Registrado por você';
      final row = _HistoryRow(
        entry: e,
        label: label,
        highlight: i == entries.length - 1,
        delta: prev == null ? null : e.weightKg - prev.weightKg,
        onDelete: e.registradoPeloMedico ? null : () => onDelete(e),
      );
      rows.add(
        e.registradoPeloMedico
            ? row
            : Dismissible(
                key: ValueKey(e.id),
                direction: DismissDirection.endToStart,
                confirmDismiss: (_) => onDelete(e),
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 18),
                  decoration: BoxDecoration(color: context.colors.dangerBg, borderRadius: BorderRadius.circular(16)),
                  child: Icon(Icons.delete_outline_rounded, color: context.colors.danger600),
                ),
                child: row,
              ),
      );
    }
    return DsCard(
      radius: 26,
      padding: const EdgeInsets.all(8),
      child: Column(children: rows),
    );
  }
}

class _HistoryRow extends StatelessWidget {
  const _HistoryRow({
    required this.entry,
    required this.label,
    required this.highlight,
    required this.delta,
    required this.onDelete,
  });

  final WeightEntry entry;
  final String label;
  final bool highlight;
  final double? delta;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return InkWell(
      onLongPress: onDelete,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: highlight ? ds.chip : ds.soft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                formatDate(entry.date).substring(0, 5),
                style: TextStyle(fontFamily: AppType.sans, fontSize: 12, fontWeight: FontWeight.w700, color: ds.chipFg),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(fontFamily: AppType.sans, fontSize: 14, color: ds.muted),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              '${formatDecimal(entry.weightKg)} kg',
              style: TextStyle(
                fontFamily: AppType.sans,
                fontWeight: FontWeight.w700,
                color: ds.title,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(width: 12),
            SizedBox(
              width: 34,
              child: Text(
                delta == null ? '' : '${delta! <= 0 ? '−' : '+'}${formatDecimal(delta!.abs())}',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontFamily: AppType.sans,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: ds.link,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
