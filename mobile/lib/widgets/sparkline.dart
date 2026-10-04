import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'motion.dart';

/// Linha da evolução do cartão "Seu progresso": área em degradê menta,
/// traço que se desenha ao aparecer e o último ponto em verde-folha.
class Sparkline extends StatelessWidget {
  const Sparkline({super.key, required this.values});

  final List<double> values;

  @override
  Widget build(BuildContext context) {
    final still = reduceMotion(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: still ? 1 : 0, end: 1),
      duration: const Duration(milliseconds: 1800),
      curve: const Interval(0.2, 1, curve: Curves.easeOutCubic),
      builder: (context, t, _) => CustomPaint(
        size: Size.infinite,
        painter: _SparkPainter(values: values, progress: t),
      ),
    );
  }
}

class _SparkPainter extends CustomPainter {
  _SparkPainter({required this.values, required this.progress});

  final List<double> values;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    if (values.length < 2) return;
    final lo = values.reduce((a, b) => a < b ? a : b);
    final hi = values.reduce((a, b) => a > b ? a : b);
    final span = (hi - lo).abs() < 0.001 ? 1.0 : hi - lo;
    // Mesma faixa da prancheta: do topo (10) ao ponto mais baixo (55) de 70.
    final top = size.height * 0.14;
    final bottom = size.height * 0.79;
    final pts = <Offset>[
      for (var i = 0; i < values.length; i++)
        Offset(size.width * i / (values.length - 1), top + (hi - values[i]) / span * (bottom - top)),
    ];

    final line = Path()..moveTo(pts.first.dx, pts.first.dy);
    for (final p in pts.skip(1)) {
      line.lineTo(p.dx, p.dy);
    }
    final area = Path.from(line)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(
      area,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x7334D399), Color(0x0034D399)],
        ).createShader(Offset.zero & size),
    );

    final metric = line.computeMetrics().first;
    canvas.drawPath(
      metric.extractPath(0, metric.length * progress),
      Paint()
        ..color = AppColors.brand300
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    if (progress >= 1) {
      final last = Offset(pts.last.dx - 6, pts.last.dy);
      canvas.drawCircle(last, 6, Paint()..color = AppColors.leaf);
      canvas.drawCircle(
        last,
        6,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5
          ..color = AppColors.brand900,
      );
    }
  }

  @override
  bool shouldRepaint(_SparkPainter old) => old.progress != progress || old.values != values;
}
