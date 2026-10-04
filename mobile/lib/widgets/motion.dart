import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Renders 3D dos modelos do site (public/3d/posters), copiados para
/// assets/3d/. São imagens: o app não carrega o .glb.
class Brand3D {
  Brand3D._();

  static const logoHeart = 'assets/3d/logo-heart.webp';
  static const sealSignature = 'assets/3d/seal-signature.webp';
}

/// True quando o sistema pede menos animação (acessibilidade). Toda
/// animação daqui respeita isso e fica parada no estado final.
bool reduceMotion(BuildContext context) => MediaQuery.maybeDisableAnimationsOf(context) ?? false;

/// Entrada suave: o conteúdo sobe alguns pixels ao aparecer. Não mexe na
/// opacidade, então nada fica invisível se a animação não rodar.
class Rise extends StatelessWidget {
  const Rise({super.key, required this.child, this.delay = Duration.zero, this.distance = 18});

  final Widget child;
  final Duration delay;
  final double distance;

  @override
  Widget build(BuildContext context) {
    if (reduceMotion(context)) return child;
    final total = const Duration(milliseconds: 650) + delay;
    final start = delay.inMilliseconds / total.inMilliseconds;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: total,
      curve: Interval(start, 1, curve: Curves.easeOutCubic),
      child: child,
      builder: (context, t, child) => Transform.translate(
        offset: Offset(0, (1 - t) * distance),
        child: Transform.scale(scale: 0.985 + 0.015 * t, child: child),
      ),
    );
  }
}

/// Coração-folha 3D flutuando, com brilho atrás e duas órbitas em
/// perspectiva (a tela de boas-vindas do redesenho).
class FloatingLogo3D extends StatefulWidget {
  const FloatingLogo3D({super.key, this.size = 220, this.orbits = true});

  final double size;
  final bool orbits;

  @override
  State<FloatingLogo3D> createState() => _FloatingLogo3DState();
}

class _FloatingLogo3DState extends State<FloatingLogo3D> with TickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  );
  late final AnimationController _orbit = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 18),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _float.stop();
      _orbit.stop();
    } else {
      if (!_float.isAnimating) _float.repeat(reverse: true);
      if (!_orbit.isAnimating) _orbit.repeat();
    }
  }

  @override
  void dispose() {
    _float.dispose();
    _orbit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    final colors = context.colors;
    return SizedBox(
      width: size * 1.35,
      height: size * 1.25,
      child: AnimatedBuilder(
        animation: Listenable.merge([_float, _orbit]),
        builder: (context, child) {
          final f = Curves.easeInOut.transform(_float.value);
          return Stack(
            alignment: Alignment.center,
            children: [
              // Brilho que respira atrás do símbolo.
              Container(
                width: size * (1.0 + 0.1 * f),
                height: size * (1.0 + 0.1 * f),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppColors.brand500.withValues(alpha: colors.isDark ? 0.30 : 0.32),
                      AppColors.brand500.withValues(alpha: 0),
                    ],
                  ),
                ),
              ),
              if (widget.orbits)
                CustomPaint(
                  size: Size(size * 1.3, size * 0.5),
                  painter: _OrbitPainter(
                    t: _orbit.value,
                    ring: (colors.isDark ? AppColors.brand300 : AppColors.brand500).withValues(
                      alpha: 0.35,
                    ),
                  ),
                ),
              Transform.translate(
                offset: Offset(0, -14 * f + 7),
                child: Transform.rotate(angle: (f - 0.5) * 0.1, child: child),
              ),
            ],
          );
        },
        child: Image.asset(
          Brand3D.logoHeart,
          width: size,
          height: size,
          fit: BoxFit.contain,
          semanticLabel: 'Símbolo Emacrescere em 3D',
        ),
      ),
    );
  }
}

/// Duas elipses (círculos vistos de lado) com um ponto verde-folha e um
/// teal correndo por elas.
class _OrbitPainter extends CustomPainter {
  _OrbitPainter({required this.t, required this.ring});

  final double t;
  final Color ring;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final outer = Rect.fromCenter(center: c, width: size.width, height: size.height);
    final inner = Rect.fromCenter(center: c, width: size.width * 0.78, height: size.height * 0.72);
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = ring;
    canvas.drawOval(outer, stroke);
    canvas.drawOval(inner, stroke..strokeWidth = 1);

    Offset on(Rect r, double a) =>
        Offset(r.center.dx + r.width / 2 * math.cos(a), r.center.dy + r.height / 2 * math.sin(a));
    final a = t * 2 * math.pi;
    final leaf = on(outer, a);
    final teal = on(inner, -a * 1.4 + 2);
    canvas.drawCircle(leaf, 9, Paint()..color = AppColors.leaf.withValues(alpha: 0.35));
    canvas.drawCircle(leaf, 5.5, Paint()..color = AppColors.leaf);
    canvas.drawCircle(teal, 4.5, Paint()..color = AppColors.teal400);
  }

  @override
  bool shouldRepaint(_OrbitPainter old) => old.t != t || old.ring != ring;
}

/// Selo 3D de receita assinada, girando devagar em perspectiva, com um
/// halo que pulsa.
class Seal3D extends StatefulWidget {
  const Seal3D({super.key, this.size = 120});

  final double size;

  @override
  State<Seal3D> createState() => _Seal3DState();
}

class _Seal3DState extends State<Seal3D> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 7),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    return SizedBox(
      width: size * 1.25,
      height: size * 1.25,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, child) {
          final t = _c.value;
          final wobble = math.sin(t * 2 * math.pi);
          final halo = (t * 2.5) % 1.0;
          return Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: size * (0.8 + 0.5 * halo),
                height: size * (0.8 + 0.5 * halo),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.brand300.withValues(alpha: 0.6 * (1 - halo)),
                    width: 2,
                  ),
                ),
              ),
              Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.0012)
                  ..rotateY(wobble * 0.42)
                  ..rotateX(math.cos(t * 2 * math.pi) * 0.12),
                child: child,
              ),
            ],
          );
        },
        child: Image.asset(
          Brand3D.sealSignature,
          width: size,
          height: size,
          fit: BoxFit.contain,
          semanticLabel: 'Selo de receita assinada digitalmente',
        ),
      ),
    );
  }
}
