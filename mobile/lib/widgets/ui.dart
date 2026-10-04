import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/theme_controller.dart';
import 'motion.dart';

// Componentes do redesenho (canvas "Emacrescere App — Redesign"). Medidas,
// raios e cores seguem as pranchetas.

/// Botão sol/lua (44 px). [onHero] = sobre o header verde (fundo branco
/// translúcido, ícone branco); senão, botão de cartão com borda menta.
class ThemeToggle extends StatelessWidget {
  const ThemeToggle({super.key, this.onHero = false});

  final bool onHero;

  @override
  Widget build(BuildContext context) {
    final themes = ThemeController.instance;
    final ds = context.ds;
    return ListenableBuilder(
      listenable: themes,
      builder: (context, _) {
        final dark = themes.isDark;
        return Semantics(
          container: true,
          button: true,
          label: dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro',
          excludeSemantics: true,
          child: Material(
            color: onHero ? Colors.white.withValues(alpha: 0.16) : ds.card,
            shape: CircleBorder(side: onHero ? BorderSide.none : BorderSide(color: ds.line)),
            child: InkWell(
              onTap: themes.toggle,
              customBorder: const CircleBorder(),
              child: SizedBox(
                width: 44,
                height: 44,
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 420),
                  switchInCurve: Curves.easeOutBack,
                  transitionBuilder: (child, animation) => RotationTransition(
                    turns: Tween<double>(begin: -0.3, end: 0).animate(animation),
                    child: ScaleTransition(scale: animation, child: child),
                  ),
                  child: Icon(
                    dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                    key: ValueKey(dark),
                    color: onHero ? Colors.white : ds.link,
                    size: 20,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Cartão do redesenho: fundo de cartão, borda menta fina, raio 24.
class DsCard extends StatelessWidget {
  const DsCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = 24,
    this.color,
    this.gradient,
    this.shadow = false,
    this.onTap,
    this.borderColor,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? color;
  final Gradient? gradient;
  final bool shadow;
  final VoidCallback? onTap;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(radius),
      side: BorderSide(color: borderColor ?? ds.line),
    );
    Widget content = Padding(padding: padding, child: child);
    if (onTap != null) {
      content = InkWell(onTap: onTap, customBorder: shape, child: content);
    }
    final box = Container(
      decoration: ShapeDecoration(
        shape: shape,
        color: gradient == null ? (color ?? ds.card) : null,
        gradient: gradient,
        shadows: shadow
            ? [
                BoxShadow(
                  color: ds.shadow.withValues(alpha: 0.35),
                  blurRadius: 34,
                  offset: const Offset(0, 18),
                  spreadRadius: -20,
                ),
              ]
            : null,
      ),
      child: Material(type: MaterialType.transparency, child: content),
    );
    return onTap == null ? box : PressScale(child: box);
  }
}

/// Encolhe um pouco ao tocar (o `:active{scale(.97)}` das pranchetas).
class PressScale extends StatefulWidget {
  const PressScale({super.key, required this.child, this.scale = 0.97});

  final Widget child;
  final double scale;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => setState(() => _down = true),
      onPointerUp: (_) => setState(() => _down = false),
      onPointerCancel: (_) => setState(() => _down = false),
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Ícone num azulejo menta 42 px (atalhos do Início).
class IconTile extends StatelessWidget {
  const IconTile({super.key, required this.icon, this.size = 42});

  final IconData icon;
  final double size;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: ds.chip, borderRadius: BorderRadius.circular(14)),
      child: Icon(icon, color: ds.chipFg, size: 22),
    );
  }
}

/// Selo arredondado de texto (status, "Pagamento confirmado", faixa de IMC).
class DsChip extends StatelessWidget {
  const DsChip({super.key, required this.label, this.bg, this.fg, this.uppercase = false});

  final String label;
  final Color? bg;
  final Color? fg;
  final bool uppercase;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg ?? ds.tint, borderRadius: BorderRadius.circular(999)),
      child: Text(
        uppercase ? label.toUpperCase() : label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: fg ?? ds.text,
          letterSpacing: uppercase ? 0.7 : 0,
        ),
      ),
    );
  }
}

/// Opção de [PillSegmented].
class PillOption<T> {
  const PillOption(this.value, this.label);
  final T value;
  final String label;
}

/// Seletor em pílulas: trilho [DesignTokens.soft] com a opção escolhida
/// destacada. [brand] = escolhida em esmeralda com texto branco (abas da
/// consulta); senão, em cartão com sombra (período do gráfico).
class PillSegmented<T> extends StatelessWidget {
  const PillSegmented({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.brand = false,
    this.height = 40,
    this.trackColor,
  });

  final List<PillOption<T>> options;
  final T value;
  final ValueChanged<T> onChanged;
  final bool brand;
  final double height;
  final Color? trackColor;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: trackColor ?? ds.soft,
        borderRadius: BorderRadius.circular(brand ? 18 : 16),
        border: brand ? Border.all(color: ds.line) : null,
      ),
      child: Row(
        children: [
          for (var i = 0; i < options.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(child: _pill(context, options[i])),
          ],
        ],
      ),
    );
  }

  Widget _pill(BuildContext context, PillOption<T> o) {
    final ds = context.ds;
    final on = o.value == value;
    final bg = on ? (brand ? AppColors.brand700 : ds.segOn) : Colors.transparent;
    final fg = on ? (brand ? Colors.white : ds.title) : (brand ? ds.text : ds.muted);
    return Semantics(
      button: true,
      selected: on,
      child: GestureDetector(
        onTap: () => onChanged(o.value),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          height: height,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(brand ? 14 : 12),
            boxShadow: on
                ? [
                    BoxShadow(
                      color: brand
                          ? AppColors.brand700.withValues(alpha: 0.5)
                          : ds.shadow.withValues(alpha: 0.3),
                      blurRadius: brand ? 18 : 14,
                      offset: Offset(0, brand ? 10 : 6),
                      spreadRadius: brand ? -12 : -8,
                    ),
                  ]
                : null,
          ),
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 250),
            style: TextStyle(
              fontFamily: AppType.sans,
              fontSize: brand ? 14 : 13,
              fontWeight: FontWeight.w600,
              color: fg,
            ),
            child: Text(o.label, maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        ),
      ),
    );
  }
}

/// Botão principal 56 px com um reflexo que atravessa (o `.shine`).
class ShineButton extends StatefulWidget {
  const ShineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.trailing,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? trailing;
  final bool loading;

  @override
  State<ShineButton> createState() => _ShineButtonState();
}

class _ShineButtonState extends State<ShineButton> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3400),
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
    final enabled = widget.onPressed != null && !widget.loading;
    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      excludeSemantics: true,
      child: PressScale(
        child: GestureDetector(
          onTap: enabled ? widget.onPressed : null,
          child: AnimatedBuilder(
            animation: _c,
            builder: (context, child) {
              // Faixa clara de 20% da largura correndo da direita pra esquerda.
              final x = 1.2 - 2.4 * _c.value;
              return Container(
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  gradient: LinearGradient(
                    begin: Alignment(x - 1, -0.2),
                    end: Alignment(x + 1, 0.2),
                    colors: enabled
                        ? const [
                            AppColors.brand700,
                            AppColors.brand700,
                            Color(0xFF129A73),
                            AppColors.brand700,
                            AppColors.brand700,
                          ]
                        : [
                            context.ds.line,
                            context.ds.line,
                            context.ds.line,
                            context.ds.line,
                            context.ds.line,
                          ],
                    stops: const [0, 0.4, 0.5, 0.6, 1],
                  ),
                ),
                child: child,
              );
            },
            child: Center(
              child: widget.loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.label,
                          style: TextStyle(
                            fontFamily: AppType.sans,
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: enabled ? Colors.white : context.ds.muted,
                          ),
                        ),
                        if (widget.trailing != null) ...[
                          const SizedBox(width: 8),
                          Icon(widget.trailing, color: Colors.white, size: 20),
                        ],
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Item da [GlassNavBar].
class GlassNavItem {
  const GlassNavItem({required this.icon, required this.label});
  final IconData icon;
  final String label;
}

/// Barra de navegação flutuante de vidro (pílula a 12 px das bordas).
/// Use com `Scaffold(extendBody: true)`: o conteúdo passa por baixo e o
/// `MediaQuery.padding.bottom` do body já inclui a altura da barra.
class GlassNavBar extends StatelessWidget {
  const GlassNavBar({super.key, required this.items, required this.index, required this.onTap});

  final List<GlassNavItem> items;
  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(12, 0, 12, 14 + bottom),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          boxShadow: [
            BoxShadow(
              color: ds.shadow.withValues(alpha: 0.35),
              blurRadius: 34,
              offset: const Offset(0, 16),
              spreadRadius: -18,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(26),
          child: BackdropFilter(
            filter: ui.ImageFilter.blur(sigmaX: 14, sigmaY: 14),
            child: Container(
              height: 70,
              decoration: BoxDecoration(
                color: ds.navBg,
                borderRadius: BorderRadius.circular(26),
                border: Border.all(color: ds.line),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [for (var i = 0; i < items.length; i++) _item(context, i)],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, int i) {
    final ds = context.ds;
    final on = i == index;
    final color = on ? ds.navOnFg : ds.navFg;
    return Semantics(
      button: true,
      selected: on,
      label: items[i].label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(i),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          constraints: const BoxConstraints(minWidth: 56),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          decoration: BoxDecoration(
            color: on ? ds.navOnBg : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(items[i].icon, size: 22, color: color),
              const SizedBox(height: 3),
              Text(
                items[i].label,
                style: TextStyle(
                  fontFamily: AppType.sans,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Mancha de luz radial do fundo (os `.blob` das pranchetas), à deriva.
class DriftBlob extends StatefulWidget {
  const DriftBlob({
    super.key,
    required this.size,
    required this.color,
    this.dx = -36,
    this.dy = 22,
  });

  final double size;
  final Color color;
  final double dx;
  final double dy;

  @override
  State<DriftBlob> createState() => _DriftBlobState();
}

class _DriftBlobState extends State<DriftBlob> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 14),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, child) {
          final t = Curves.easeInOut.transform(_c.value);
          return Transform.translate(
            offset: Offset(widget.dx * t, widget.dy * t),
            child: Transform.scale(scale: 1 + 0.18 * t, child: child),
          );
        },
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [widget.color, widget.color.withValues(alpha: 0)],
              stops: const [0, 0.7],
            ),
          ),
        ),
      ),
    );
  }
}

/// Ponto que pulsa (notificação no sino, consulta de hoje da médica).
class PulseDot extends StatefulWidget {
  const PulseDot({super.key, this.color = AppColors.leaf, this.size = 9});

  final Color color;
  final double size;

  @override
  State<PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
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
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) => Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color,
          boxShadow: [
            BoxShadow(
              color: widget.color.withValues(alpha: 0.7 * (1 - _c.value)),
              spreadRadius: 10 * _c.value,
            ),
          ],
        ),
      ),
    );
  }
}

/// Avatar com iniciais (degradê esmeralda), como "FC" e "MC" das pranchetas.
class InitialsTile extends StatelessWidget {
  const InitialsTile({
    super.key,
    required this.name,
    this.size = 52,
    this.radius = 16,
    this.fontSize = 17,
  });

  final String name;
  final double size;
  final double radius;
  final double fontSize;

  static String initialsOf(String name) {
    final parts = name
        .replaceFirst(RegExp(r'^dr\.?a?\.?\s+', caseSensitive: false), '')
        .trim()
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .toList();
    if (parts.isEmpty) return '?';
    final first = parts.first[0];
    final last = parts.length > 1 ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: const LinearGradient(colors: [AppColors.brand700, AppColors.brand500]),
      ),
      child: Text(
        initialsOf(name),
        style: TextStyle(
          fontFamily: AppType.sans,
          color: Colors.white,
          fontWeight: FontWeight.w700,
          fontSize: fontSize,
        ),
      ),
    );
  }
}

/// Saudação pela hora do aparelho.
String greetingForNow([DateTime? now]) {
  final h = (now ?? DateTime.now()).hour;
  if (h < 12) return 'Bom dia,';
  if (h < 18) return 'Boa tarde,';
  return 'Boa noite,';
}
