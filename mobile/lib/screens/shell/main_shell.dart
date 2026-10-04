import 'package:flutter/material.dart';

import '../../widgets/ui.dart';
import '../consultations/chat/chat_tab_screen.dart';
import '../consultations/consultations_screen.dart';
import '../home/dashboard_screen.dart';
import '../profile/profile_screen.dart';
import '../tracking/tracking_screen.dart';

enum ShellTab { home, tracking, consultations, chat, profile }

/// Deixa qualquer tela dentro do shell trocar de aba (ex.: atalhos da
/// Home) sem precisar conhecer o BottomNavigationBar.
class ShellTabScope extends InheritedWidget {
  const ShellTabScope({
    super.key,
    required this.select,
    required this.current,
    required super.child,
  });

  final void Function(ShellTab tab) select;

  /// Aba visível agora. As abas ficam num IndexedStack (todas vivas), então
  /// cada tela usa isso pra recarregar seus dados quando volta a aparecer —
  /// senão a lista de consultas só mudava depois de uma ação feita no
  /// próprio app (o médico iniciar a consulta, por ex., nunca aparecia).
  final ShellTab current;

  static ShellTabScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShellTabScope>();

  @override
  bool updateShouldNotify(ShellTabScope oldWidget) =>
      select != oldWidget.select || current != oldWidget.current;
}

/// Shell principal do app logado: navegação inferior com as 5 abas.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _tabs = [
    DashboardScreen(),
    TrackingScreen(),
    ConsultationsScreen(),
    ChatTabScreen(),
    ProfileScreen(),
  ];

  void _select(ShellTab tab) => setState(() => _currentIndex = tab.index);

  @override
  Widget build(BuildContext context) {
    return ShellTabScope(
      select: _select,
      current: ShellTab.values[_currentIndex],
      child: Scaffold(
        // A barra flutua sobre o conteúdo (vidro); o body já recebe a altura
        // dela no MediaQuery.padding.bottom.
        extendBody: true,
        body: IndexedStack(index: _currentIndex, children: _tabs),
        bottomNavigationBar: GlassNavBar(
          index: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: const [
            GlassNavItem(icon: Icons.home_outlined, label: 'Início'),
            GlassNavItem(icon: Icons.monitor_weight_outlined, label: 'Peso'),
            GlassNavItem(icon: Icons.calendar_month_outlined, label: 'Consultas'),
            GlassNavItem(icon: Icons.chat_bubble_outline_rounded, label: 'Chat'),
            GlassNavItem(icon: Icons.person_outline_rounded, label: 'Perfil'),
          ],
        ),
      ),
    );
  }
}
