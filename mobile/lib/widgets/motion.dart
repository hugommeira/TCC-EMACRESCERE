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

/// Coração-folha 3D flutuando, com um brilho suave atrás e a sombra no
/// "chão" que encolhe quando ele sobe (a tela de boas-vindas). Nos headers
/// vai só o símbolo flutuando ([glow] e [groundShadow] desligados).
class FloatingLogo3D extends StatefulWidget {
  const FloatingLogo3D({super.key, this.size = 220, this.groundShadow = true, this.glow = true});

  final double size;

  /// Sombra elíptica embaixo do símbolo, acompanhando a flutuação.
  final bool groundShadow;

  /// Brilho que respira atrás do símbolo.
  final bool glow;

  @override
  State<FloatingLogo3D> createState() => _FloatingLogo3DState();
}

class _FloatingLogo3DState extends State<FloatingLogo3D> with SingleTickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _float.stop();
    } else if (!_float.isAnimating) {
      _float.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    final dark = context.colors.isDark;
    final framed = widget.groundShadow || widget.glow;
    return SizedBox(
      width: framed ? size * 1.35 : size,
      height: framed ? size * 1.25 : size,
      child: AnimatedBuilder(
        animation: _float,
        builder: (context, child) {
          final f = Curves.easeInOut.transform(_float.value); // 0 = baixo, 1 = alto
          return Stack(
            alignment: Alignment.center,
            children: [
              if (widget.glow)
                Container(
                  width: size * (1.0 + 0.06 * f),
                  height: size * (1.0 + 0.06 * f),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.brand500.withValues(alpha: dark ? 0.26 : 0.24),
                        AppColors.brand500.withValues(alpha: 0),
                      ],
                    ),
                  ),
                ),
              if (widget.groundShadow)
                Positioned(
                  bottom: size * 0.04,
                  // Um círculo com degradê radial esticado na horizontal vira
                  // a elipse da sombra; ela encolhe e clareia quando o símbolo sobe.
                  child: Transform.scale(
                    scaleX: 4.2 * (1 - 0.18 * f),
                    child: Container(
                      width: size * 0.16,
                      height: size * 0.16,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            (dark ? Colors.black : AppColors.brand900).withValues(
                              alpha: (dark ? 0.55 : 0.28) * (1 - 0.4 * f),
                            ),
                            (dark ? Colors.black : AppColors.brand900).withValues(alpha: 0),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              Transform.translate(
                offset: Offset(0, -14 * f + 7),
                child: Transform.rotate(angle: (f - 0.5) * 0.08, child: child),
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
