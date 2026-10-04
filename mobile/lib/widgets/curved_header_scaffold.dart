import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'app_header.dart';
import 'motion.dart';

/// Estrutura reutilizada entre as abas: header verde curvo com um card
/// branco "subindo" por cima dele, seguido do resto do conteúdo.
///
/// Tudo rola junto num scroll só — header, card sobreposto e conteúdo —
/// e o card tem a altura do próprio conteúdo (nada de altura fixa por
/// tela, que era o que causava overflow e conteúdo "sumindo" por baixo
/// do card em telas pequenas).
class CurvedHeaderScaffold extends StatelessWidget {
  const CurvedHeaderScaffold({
    super.key,
    required this.user,
    required this.overlapCard,
    required this.children,
    this.trailingIcon = Icons.notifications_outlined,
    this.onTrailingTap,
    this.onRefresh,
    this.headerTitle,
  });

  final SessionUser? user;
  final Widget overlapCard;
  final List<Widget> children;
  final IconData trailingIcon;
  final VoidCallback? onTrailingTap;

  /// Se informado, habilita pull-to-refresh.
  final Future<void> Function()? onRefresh;

  /// Texto grande do header (default: primeiro nome). Ex.: "Dr(a). Silva".
  final String? headerTitle;

  static const _horizontalPadding = 16.0;

  @override
  Widget build(BuildContext context) {
    final statusBar = MediaQuery.paddingOf(context).top;
    final cardTop = statusBar + GreenHeader.topPadding + GreenHeader.rowHeight + GreenHeader.gapBelowRow;

    Widget body = ListView(
      padding: EdgeInsets.zero,
      physics: onRefresh != null ? const AlwaysScrollableScrollPhysics() : null,
      children: [
        Stack(
          children: [
            // Fundo verde por trás; o card sobreposto invade os últimos
            // GreenHeader.overlap px dele.
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: GreenHeader(
                user: user,
                trailingIcon: trailingIcon,
                onTrailingTap: onTrailingTap,
                title: headerTitle,
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: cardTop),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
                  child: Rise(child: overlapCard),
                ),
                Padding(
                  // Embaixo: espaço da barra de navegação flutuante (vem no
                  // MediaQuery quando o shell usa extendBody).
                  padding: EdgeInsets.fromLTRB(
                    _horizontalPadding,
                    16,
                    _horizontalPadding,
                    24 + MediaQuery.paddingOf(context).bottom,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    // Cada bloco entra um pouco depois do anterior.
                    children: [
                      for (var i = 0; i < children.length; i++)
                        Rise(
                          delay: Duration(milliseconds: 60 * (i + 1).clamp(1, 6)),
                          child: children[i],
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );

    if (onRefresh != null) {
      body = RefreshIndicator(onRefresh: onRefresh!, child: body);
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: context.ds.bg,
        body: body,
      ),
    );
  }
}
