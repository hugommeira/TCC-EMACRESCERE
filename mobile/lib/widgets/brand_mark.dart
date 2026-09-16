import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_theme.dart';

/// Símbolo do logo (coração-folha) — o mesmo path SVG do site
/// (components/landing/Logo.tsx), em assets/logo/mark.svg. Branco por
/// padrão; passe [color] pra recolorir.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 24, this.color = Colors.white});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/logo/mark.svg',
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }
}

/// Símbolo branco sobre azulejo arredondado com o degradê da marca — o
/// mesmo visual do ícone do app/site (icon-512.png).
class BrandTile extends StatelessWidget {
  const BrandTile({super.key, this.size = 64});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [
          BoxShadow(
            color: AppColors.brand600.withValues(alpha: 0.25),
            blurRadius: size * 0.3,
            offset: Offset(0, size * 0.12),
          ),
        ],
      ),
      child: Center(child: BrandMark(size: size * 0.58)),
    );
  }
}

/// Azulejo + "Emacrescere" no verde-escuro do letreiro. Pra telas de
/// entrada (bloqueio, login, cadastro, onboarding).
class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key, this.tileSize = 72, this.tagline});

  final double tileSize;
  final String? tagline;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandTile(size: tileSize),
        const SizedBox(height: 16),
        const Text(
          'Emacrescere',
          style: TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
            letterSpacing: -0.5,
          ),
        ),
        if (tagline != null) ...[
          const SizedBox(height: 4),
          Text(tagline!, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
        ],
      ],
    );
  }
}
