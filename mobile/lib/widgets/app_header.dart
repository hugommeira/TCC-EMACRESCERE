import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'motion.dart';
import 'ui.dart';

/// Header das abas: degradê da marca, avatar + saudação, e o símbolo do
/// logo em marca d'água no canto. Curva embaixo pra o card sobreposto.
///
/// Ele mesmo cobre a área da status bar (padding superior = inset do
/// sistema), por isso quem o usa não deve envolvê-lo em SafeArea.
class GreenHeader extends StatelessWidget {
  const GreenHeader({
    super.key,
    required this.user,
    this.trailingIcon = Icons.notifications_outlined,
    this.onTrailingTap,
    this.title,
  });

  final SessionUser? user;
  final IconData trailingIcon;
  final VoidCallback? onTrailingTap;

  /// Texto grande do header. Default: primeiro nome do usuário.
  final String? title;

  /// Altura da linha avatar + saudação (fixa, pra o scaffold saber onde
  /// posicionar o card sobreposto sem chutar altura de conteúdo).
  static const rowHeight = 48.0;
  static const topPadding = 16.0;

  /// Espaço entre a saudação e o topo do card sobreposto.
  static const gapBelowRow = 24.0;

  /// Quanto do fundo verde continua por baixo do card sobreposto.
  static const overlap = 28.0;

  /// Altura total do fundo verde, sem contar a status bar.
  static const backgroundHeight = topPadding + rowHeight + gapBelowRow + overlap;

  @override
  Widget build(BuildContext context) {
    final firstName = title ?? (user?.name?.split(' ').first ?? '');
    final statusBar = MediaQuery.paddingOf(context).top;
    final height = statusBar + backgroundHeight;

    return ClipRRect(
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(32),
        bottomRight: Radius.circular(32),
      ),
      child: Container(
        width: double.infinity,
        height: height,
        decoration: BoxDecoration(gradient: context.colors.headerGradient),
        child: Stack(
          children: [
            // Marca d'água: símbolo grande, translúcido, sangrando pela
            // direita.
            // Coração-folha 3D flutuando no canto, como no redesenho.
            Positioned(
              right: -18,
              top: statusBar + 6,
              child: const Opacity(opacity: 0.9, child: FloatingLogo3D(size: 104, orbits: false, glow: false)),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, statusBar + topPadding, 20, 0),
              child: Align(
                alignment: Alignment.topCenter,
                child: SizedBox(
                  height: rowHeight,
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 1.5),
                          image: user?.image != null
                              ? DecorationImage(image: NetworkImage(user!.image!), fit: BoxFit.cover)
                              : null,
                        ),
                        child: user?.image == null
                            ? const Icon(Icons.person_rounded, color: Colors.white, size: 26)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Olá,',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 14,
                                height: 1.2,
                              ),
                            ),
                            Text(
                              firstName.isEmpty ? '...' : firstName,
                              style: AppType.title(24, Colors.white, height: 1.15),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (onTrailingTap != null) ...[
                        const SizedBox(width: 8),
                        Material(
                          color: Colors.white.withValues(alpha: 0.18),
                          shape: const CircleBorder(),
                          child: InkWell(
                            onTap: onTrailingTap,
                            customBorder: const CircleBorder(),
                            child: SizedBox(
                              width: 44,
                              height: 44,
                              child: Icon(trailingIcon, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(width: 8),
                      const ThemeToggle(onHero: true),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
