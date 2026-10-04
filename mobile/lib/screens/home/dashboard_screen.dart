import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import '../../services/auth_service.dart';
import '../../services/consultation_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/curved_header_scaffold.dart';
import '../consultations/cancel_consultation.dart';
import '../consultations/consultation_actions.dart';
import '../consultations/consultation_detail_screen.dart';
import '../shell/main_shell.dart';
import '../shell/tab_visibility.dart';

/// Home/Dashboard: saudação com o nome real da sessão, atalhos pras
/// outras abas e a próxima consulta do paciente (GET /api/consultations).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TabVisibilityMixin<DashboardScreen> {
  @override
  ShellTab get tab => ShellTab.home;

  // Aba voltou a aparecer: atualiza sem trocar a lista por um spinner.
  @override
  void onTabShown() => _refreshSilently();

  Future<void> _refreshSilently() async {
    try {
      final data = await ConsultationService.getConsultations();
      if (mounted) setState(() { _future = Future.value(data); });
    } catch (_) {
      // mantém o que tinha; o pull-to-refresh mostra o erro se persistir
    }
  }

  SessionUser? _user;
  late Future<List<Consultation>> _future;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _future = ConsultationService.getConsultations();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _reload() async {
    setState(() { _future = ConsultationService.getConsultations(); });
    await _future;
  }

  void _goTo(ShellTab tab) => ShellTabScope.maybeOf(context)?.select(tab);

  void _openDetail(Consultation consultation) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ConsultationDetailScreen(consultationId: consultation.id),
      ),
    );
  }

  Future<void> _openActive(Consultation consultation) async {
    await openConsultation(context, consultation);
    if (mounted) await _reload();
  }

  Future<void> _cancel(Consultation consultation) async {
    if (await confirmAndCancelConsultation(context, consultation)) await _reload();
  }

  /// "Receitas" abre a consulta mais recente que tem prescrição.
  Future<void> _openLatestPrescription() async {
    final consultations = await _future;
    final withPrescription = consultations.where((c) => c.prescriptionId != null).toList()
      ..sort((a, b) => b.displayDate.compareTo(a.displayDate));
    if (!mounted) return;
    if (withPrescription.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Você ainda não tem receitas.')),
      );
      return;
    }
    _openDetail(withPrescription.first);
  }

  @override
  Widget build(BuildContext context) {
    return CurvedHeaderScaffold(
      user: _user,
      onRefresh: _reload,
      overlapCard: _QuickAccessCard(
        onWeight: () => _goTo(ShellTab.tracking),
        onConsultation: () => _goTo(ShellTab.consultations),
        onChat: () => _goTo(ShellTab.chat),
        onPrescriptions: _openLatestPrescription,
      ),
      children: [
        Text('Próxima consulta', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        FutureBuilder<List<Consultation>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError) {
              return _InfoCard(
                icon: Icons.error_outline,
                text: 'Não foi possível carregar suas consultas.',
                actionLabel: 'Tentar de novo',
                onAction: _reload,
              );
            }

            final next = _pickNext(snapshot.data ?? []);
            if (next == null) {
              return _InfoCard(
                icon: Icons.event_available_outlined,
                text: 'Você não tem consulta marcada.',
                actionLabel: 'Nova consulta',
                onAction: () => _goTo(ShellTab.consultations),
              );
            }

            return AppointmentCard(
              consultation: next,
              onCancel: next.status == ConsultationStatus.inProgress ? null : () => _cancel(next),
              primaryLabel: primaryActionLabel(next),
              onPrimary: () => _openActive(next),
            );
          },
        ),
      ],
    );
  }

  /// Qual consulta mostrar como "próxima": em andamento/na fila ganha de
  /// agendada; entre agendadas, a futura mais perto; se só sobrou
  /// agendada no passado (não foi fechada pelo médico), a mais recente.
  static Consultation? _pickNext(List<Consultation> all) {
    final active = all.where((c) => c.status.isActive).toList();
    if (active.isEmpty) return null;

    final ongoing = active.where((c) => c.status != ConsultationStatus.scheduled);
    if (ongoing.isNotEmpty) return ongoing.first;

    final now = DateTime.now();
    final upcoming = active.where((c) => !c.displayDate.isBefore(now)).toList()
      ..sort((a, b) => a.displayDate.compareTo(b.displayDate));
    if (upcoming.isNotEmpty) return upcoming.first;

    active.sort((a, b) => b.displayDate.compareTo(a.displayDate));
    return active.first;
  }
}

class _QuickAccessCard extends StatelessWidget {
  const _QuickAccessCard({
    required this.onWeight,
    required this.onConsultation,
    required this.onChat,
    required this.onPrescriptions,
  });

  final VoidCallback onWeight;
  final VoidCallback onConsultation;
  final VoidCallback onChat;
  final VoidCallback onPrescriptions;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Acesso Rápido', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 16),
            Row(
              children: [
                _QuickAccessItem(icon: Icons.monitor_weight_outlined, label: 'Peso', onTap: onWeight),
                _QuickAccessItem(
                  icon: Icons.medical_services_outlined,
                  label: 'Consulta',
                  onTap: onConsultation,
                ),
                _QuickAccessItem(icon: Icons.chat_bubble_outline, label: 'Chat', onTap: onChat),
                _QuickAccessItem(
                  icon: Icons.description_outlined,
                  label: 'Receitas',
                  onTap: onPrescriptions,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickAccessItem extends StatelessWidget {
  const _QuickAccessItem({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: context.colors.softGradient,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.colors.brand100),
                ),
                child: Icon(icon, color: context.colors.brand700, size: 24),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Card de estado (vazio/erro) com uma ação.
class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.text,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String text;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
              ],
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onAction, child: Text(actionLabel)),
          ],
        ),
      ),
    );
  }
}
