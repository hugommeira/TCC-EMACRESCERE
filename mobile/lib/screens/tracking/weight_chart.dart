import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';

/// Evolução do peso (ou do IMC) ao longo do tempo.
///
/// Uma série só, um eixo só. A meta entra como linha de referência
/// tracejada, não como segunda série.
class WeightChart extends StatelessWidget {
  const WeightChart({
    super.key,
    required this.entries,
    this.metric = WeightMetric.weight,
    this.goalKg,
  });

  final List<WeightEntry> entries;
  final WeightMetric metric;
  final double? goalKg;

  double? _valueOf(WeightEntry e) =>
      metric == WeightMetric.weight ? e.weightKg : e.bmi;

  @override
  Widget build(BuildContext context) {
    final pontos = <({WeightEntry entry, double value})>[
      for (final e in entries)
        if (_valueOf(e) != null) (entry: e, value: _valueOf(e)!),
    ];

    if (pontos.isEmpty) {
      return Center(
        child: Text(
          metric == WeightMetric.bmi
              ? 'Informe sua altura para ver o IMC.'
              : 'Nenhuma pesagem neste período.',
          textAlign: TextAlign.center,
          style: TextStyle(color: context.colors.gray600),
        ),
      );
    }

    final spots = [
      for (var i = 0; i < pontos.length; i++) FlSpot(i.toDouble(), pontos[i].value),
    ];

    final mostrarMeta = metric == WeightMetric.weight && goalKg != null;

    final valores = [
      for (final p in pontos) p.value,
      if (mostrarMeta) goalKg!,
    ];
    final minValor = valores.reduce((a, b) => a < b ? a : b);
    final maxValor = valores.reduce((a, b) => a > b ? a : b);

    // Passo "redondo" do eixo Y (0.5, 1, 2, 5, 10...) pra ~4 linhas sem
    // repetir rótulo — com variação pequena (ex.: 39→40 kg) o passo
    // automático mostrava "40, 40, 40, 39, 39".
    final minimoIntervalo = metric == WeightMetric.bmi ? 1.0 : 2.0;
    final interval = _niceStep(
      (maxValor - minValor).clamp(minimoIntervalo, double.infinity) / 4,
    );
    final minY = (minValor / interval).floor() * interval - interval;
    final maxY = (maxValor / interval).ceil() * interval + interval;
    final decimals = interval < 1 ? 1 : 0;

    return LineChart(
      LineChartData(
        minY: minY,
        maxY: maxY,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        extraLinesData: mostrarMeta
            ? ExtraLinesData(
                horizontalLines: [
                  HorizontalLine(
                    y: goalKg!,
                    color: context.colors.gray400,
                    strokeWidth: 1.5,
                    dashArray: const [5, 4],
                    label: HorizontalLineLabel(
                      show: true,
                      alignment: Alignment.topRight,
                      style: TextStyle(fontSize: 10, color: context.colors.gray600),
                      labelResolver: (_) => 'meta ${formatDecimal(goalKg!)} kg',
                    ),
                  ),
                ],
              )
            : const ExtraLinesData(),
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touched) => [
              for (final t in touched)
                LineTooltipItem(
                  '${formatDecimal(t.y)}${metric == WeightMetric.weight ? ' kg' : ''}\n'
                  '${_dataCurta(pontos[t.x.round()].entry.date)}',
                  const TextStyle(color: Colors.white, fontSize: 12),
                ),
            ],
          ),
        ),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: interval,
              getTitlesWidget: (value, meta) => Text(
                formatDecimal(value, decimals),
                style: TextStyle(fontSize: 11, color: context.colors.gray600),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: (pontos.length / 4).clamp(1, double.infinity).ceilToDouble(),
              getTitlesWidget: (value, meta) {
                final index = value.round();
                if (index < 0 || index >= pontos.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    _dataCurta(pontos[index].entry.date),
                    style: TextStyle(fontSize: 11, color: context.colors.gray600),
                  ),
                );
              },
            ),
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: context.colors.brand600,
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: context.colors.brand500.withValues(alpha: 0.12),
            ),
          ),
        ],
      ),
    );
  }
}

String _dataCurta(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';

/// Arredonda um passo bruto pro valor "bonito" mais próximo acima
/// (0.5, 1, 2, 5, 10, 20, 50...).
double _niceStep(double raw) {
  const candidates = [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0];
  for (final c in candidates) {
    if (raw <= c) return c;
  }
  return candidates.last;
}
