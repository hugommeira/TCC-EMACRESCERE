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

    final minY = entries.map((e) => e.weightKg).reduce((a, b) => a < b ? a : b);
    final maxY = entries.map((e) => e.weightKg).reduce((a, b) => a > b ? a : b);
    final padding = (maxY - minY).clamp(2, double.infinity) * 0.2;

    return LineChart(
      LineChartData(
        minY: minY - padding,
        maxY: maxY + padding,
        gridData: const FlGridData(show: false),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (value, meta) => Text(
                value.toStringAsFixed(0),
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
