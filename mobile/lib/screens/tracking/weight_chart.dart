import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../theme/app_theme.dart';

/// Gráfico simples de evolução do peso ao longo do tempo.
class WeightChart extends StatelessWidget {
  const WeightChart({super.key, required this.entries});

  final List<WeightEntry> entries;

  @override
  Widget build(BuildContext context) {
    final spots = [
      for (var i = 0; i < entries.length; i++) FlSpot(i.toDouble(), entries[i].weightKg),
    ];

    final minWeight = entries.map((e) => e.weightKg).reduce((a, b) => a < b ? a : b);
    final maxWeight = entries.map((e) => e.weightKg).reduce((a, b) => a > b ? a : b);

    // Passo "redondo" do eixo Y (0.5, 1, 2, 5, 10 kg...) pra ~4 linhas
    // sem repetir rótulo — com variação pequena (ex.: 39→40 kg) o passo
    // automático + arredondamento mostrava "40, 40, 40, 39, 39".
    final interval = _niceStep((maxWeight - minWeight).clamp(2, double.infinity) / 4);
    final minY = (minWeight / interval).floor() * interval - interval;
    final maxY = (maxWeight / interval).ceil() * interval + interval;
    final decimals = interval < 1 ? 1 : 0;

    return LineChart(
      LineChartData(
        minY: minY,
        maxY: maxY,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              interval: interval,
              getTitlesWidget: (value, meta) => Text(
                value.toStringAsFixed(decimals),
                style: const TextStyle(fontSize: 11, color: AppColors.gray600),
              ),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: (entries.length / 4).clamp(1, double.infinity).ceilToDouble(),
              getTitlesWidget: (value, meta) {
                final index = value.round();
                if (index < 0 || index >= entries.length) return const SizedBox.shrink();
                final date = entries[index].date;
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${date.day}/${date.month}',
                    style: const TextStyle(fontSize: 11, color: AppColors.gray600),
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
            color: AppColors.brand600,
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: AppColors.brand500.withValues(alpha: 0.12),
            ),
          ),
        ],
      ),
    );
  }
}

/// Arredonda um passo bruto pro valor "bonito" mais próximo acima
/// (0.5, 1, 2, 5, 10, 20, 50...).
double _niceStep(double raw) {
  const candidates = [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0];
  for (final c in candidates) {
    if (raw <= c) return c;
  }
  return candidates.last;
}
