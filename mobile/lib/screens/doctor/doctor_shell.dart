import 'package:flutter/material.dart';

import '../../constants.dart';
import '../../widgets/ui.dart';
import '../consultations/agenda/agenda_screen.dart';
import 'doctor_consultations_screen.dart';
import 'doctor_profile_screen.dart';
import 'doctor_queue_screen.dart';

enum DoctorTab { queue, consultations, agenda, profile }

/// Mesmo mecanismo do ShellTabScope do paciente, pro lado do médico.
class DoctorTabScope extends InheritedWidget {
  const DoctorTabScope({super.key, required this.select, required super.child});

  final void Function(DoctorTab tab) select;

  static DoctorTabScope? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<DoctorTabScope>();

  @override
  bool updateShouldNotify(DoctorTabScope oldWidget) => select != oldWidget.select;
}

/// Shell do MÉDICO credenciado: consultas, agenda (a tela reservada desde o
/// início pra este perfil) e perfil — mais a fila de atendimento quando
/// [kQueueEnabled] estiver ligada.
class DoctorShell extends StatefulWidget {
  const DoctorShell({super.key});

  @override
  State<DoctorShell> createState() => _DoctorShellState();
}

class _DoctorShellState extends State<DoctorShell> {
  /// Abas visíveis, nesta ordem. Com a fila desligada ela sai da lista em vez
  /// de virar uma aba vazia, e o índice da NavigationBar passa a ser a posição
  /// AQUI — não mais `DoctorTab.index`, que continua contando a fila.
  static final List<DoctorTab> _visibleTabs = [
    if (kQueueEnabled) DoctorTab.queue,
    DoctorTab.consultations,
    DoctorTab.agenda,
    DoctorTab.profile,
  ];

  int _currentIndex = 0;

  /// Aba escondida é pedido ignorado: melhor não navegar do que cair num
  /// índice que não existe mais.
  void _select(DoctorTab tab) {
    final index = _visibleTabs.indexOf(tab);
    if (index < 0) return;
    setState(() => _currentIndex = index);
  }

  Widget _screenFor(DoctorTab tab) => switch (tab) {
        DoctorTab.queue => const DoctorQueueScreen(),
        DoctorTab.consultations => const DoctorConsultationsScreen(),
        DoctorTab.agenda => AgendaScreen(
            primaryActionLabel:
                kQueueEnabled ? 'VER FILA DE ATENDIMENTO' : 'VER MINHAS CONSULTAS',
            onPrimaryAction: () =>
                _select(kQueueEnabled ? DoctorTab.queue : DoctorTab.consultations),
          ),
        DoctorTab.profile => const DoctorProfileScreen(),
      };

  GlassNavItem _destinationFor(DoctorTab tab) => switch (tab) {
        DoctorTab.queue => const GlassNavItem(icon: Icons.groups_outlined, label: 'Fila'),
        DoctorTab.consultations => const GlassNavItem(icon: Icons.calendar_month_outlined, label: 'Consultas'),
        DoctorTab.agenda => const GlassNavItem(icon: Icons.schedule_rounded, label: 'Agenda'),
        DoctorTab.profile => const GlassNavItem(icon: Icons.person_outline_rounded, label: 'Perfil'),
      };

  @override
  Widget build(BuildContext context) {
    return DoctorTabScope(
      select: _select,
      child: Scaffold(
        extendBody: true,
        body: IndexedStack(
          index: _currentIndex,
          children: [for (final tab in _visibleTabs) _screenFor(tab)],
        ),
        bottomNavigationBar: GlassNavBar(
          index: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: [for (final tab in _visibleTabs) _destinationFor(tab)],
        ),
      ),
    );
  }
}
