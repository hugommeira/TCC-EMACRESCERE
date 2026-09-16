import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
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

/// Shell do MÉDICO credenciado: fila de atendimento, consultas, agenda
/// (a tela reservada desde o início pra este perfil) e perfil.
class DoctorShell extends StatefulWidget {
  const DoctorShell({super.key});

  @override
  State<DoctorShell> createState() => _DoctorShellState();
}

class _DoctorShellState extends State<DoctorShell> {
  int _currentIndex = 0;

  void _select(DoctorTab tab) => setState(() => _currentIndex = tab.index);

  @override
  Widget build(BuildContext context) {
    final tabs = [
      const DoctorQueueScreen(),
      const DoctorConsultationsScreen(),
      AgendaScreen(
        primaryActionLabel: 'VER FILA DE ATENDIMENTO',
        onPrimaryAction: () => _select(DoctorTab.queue),
      ),
      const DoctorProfileScreen(),
    ];

    return DoctorTabScope(
      select: _select,
      child: Scaffold(
        body: IndexedStack(index: _currentIndex, children: tabs),
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
                icon: Icon(Icons.groups_outlined),
                selectedIcon: Icon(Icons.groups_rounded),
                label: 'Fila',
              ),
              NavigationDestination(
                icon: Icon(Icons.medical_services_outlined),
                selectedIcon: Icon(Icons.medical_services_rounded),
                label: 'Consultas',
              ),
              NavigationDestination(
                icon: Icon(Icons.calendar_month_outlined),
                selectedIcon: Icon(Icons.calendar_month_rounded),
                label: 'Agenda',
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
