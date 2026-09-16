import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
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
        body: IndexedStack(index: _currentIndex, children: _tabs),
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.brand100)),
          ),
          child: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (index) => setState(() => _currentIndex = index),
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home_rounded),
                label: 'Início',
              ),
              NavigationDestination(
                icon: Icon(Icons.monitor_weight_outlined),
                selectedIcon: Icon(Icons.monitor_weight_rounded),
                label: 'Peso',
              ),
              NavigationDestination(
                icon: Icon(Icons.medical_services_outlined),
                selectedIcon: Icon(Icons.medical_services_rounded),
                label: 'Consultas',
              ),
              NavigationDestination(
                icon: Icon(Icons.chat_bubble_outline_rounded),
                selectedIcon: Icon(Icons.chat_bubble_rounded),
                label: 'Chat',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline_rounded),
                selectedIcon: Icon(Icons.person_rounded),
                label: 'Perfil',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
