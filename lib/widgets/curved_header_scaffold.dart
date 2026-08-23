import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'app_header.dart';

/// Estrutura reutilizada entre as abas: header verde curvo com um card
/// branco "subindo" por cima dele, seguido do resto do conteúdo rolável.
/// Mesmo padrão visual estabelecido na Home.
class CurvedHeaderScaffold extends StatelessWidget {
  const CurvedHeaderScaffold({
    super.key,
    required this.user,
    required this.overlapCard,
    required this.overlapCardHeight,
    required this.children,
  });

  final SessionUser? user;
  final Widget overlapCard;
  final double overlapCardHeight;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.gray50,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              SizedBox(
                height: GreenHeader.height,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned.fill(child: GreenHeader(user: user)),
                    Positioned(
                      top: GreenHeader.height - GreenHeader.overlap,
                      left: 16,
                      right: 16,
                      height: overlapCardHeight,
                      child: overlapCard,
                    ),
                  ],
                ),
              ),
              SizedBox(height: overlapCardHeight - GreenHeader.overlap),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: children,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
