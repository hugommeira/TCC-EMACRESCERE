import 'package:flutter/material.dart';

import '../../constants.dart';
import '../../models/consultation.dart';
import '../../services/auth_service.dart';
import '../../services/consultation_service.dart';
import '../shell/main_shell.dart';
import '../shell/tab_visibility.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/curved_header_scaffold.dart';
import 'cancel_consultation.dart';
import 'consultation_detail_screen.dart';
import 'consultation_actions.dart';
import 'queue/enter_queue_screen.dart';
import 'schedule/schedule_screen.dart';

/// Aba Consultas: mesmo header verde curvo da Home/Peso, consulta ativa
/// (se houver), atalho pra marcar nova, e histórico real
/// (GET /api/consultations).
///
/// A tela de Agenda (agenda/agenda_screen.dart) foi tirada daqui de
/// propósito: calendário é conceito da futura tela do médico, não do
/// paciente. O código fica guardado, só não é referenciado.
class ConsultationsScreen extends StatefulWidget {
  const ConsultationsScreen({super.key});

  @override
  State<ConsultationsScreen> createState() => _ConsultationsScreenState();
}

class _ConsultationsScreenState extends State<ConsultationsScreen> with TabVisibilityMixin<ConsultationsScreen> {
  @override
  ShellTab get tab => ShellTab.consultations;

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

  void _openDetail(Consultation consultation) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ConsultationDetailScreen(consultationId: consultation.id),
      ),
    );
  }

  /// Com a fila desligada, "Nova consulta" é marcar horário — não entrar numa
  /// fila que o backend não atende.
  Future<void> _openNewConsultation() async {
    if (!kQueueEnabled) return _openSchedule();
    final entered = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const EnterQueueScreen()),
    );
    if (entered == true) await _reload();
  }

  Future<void> _openActive(Consultation consultation) async {
    await openConsultation(context, consultation);
    if (mounted) await _reload();
  }

  Future<void> _openSchedule() async {
    final scheduled = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const ScheduleScreen()),
    );
    if (scheduled == true) await _reload();
  }

  Future<void> _cancel(Consultation consultation) async {
    if (await confirmAndCancelConsultation(context, consultation)) await _reload();
  }

  @override
  Widget build(BuildContext context) {
    return CurvedHeaderScaffold(
        user: _user,
        onRefresh: _reload,
        overlapCard: _NewConsultationCard(onTap: _openNewConsultation),
        children: [
          // Com a fila desligada este atalho é redundante: o cartão de cima já
          // leva pro agendamento.
          if (kQueueEnabled) ...[
            Card(
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.cardLarge),
                onTap: _openSchedule,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          size: 18, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text('Agendar com um médico específico',
                            style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      Icon(Icons.chevron_right, color: context.colors.gray400),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
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
                return _ErrorState(onRetry: _reload, error: snapshot.error.toString());
              }

              final consultations = snapshot.data ?? [];
              final active = consultations.where((c) => c.status.isActive).toList();
              final history = consultations.where((c) => !c.status.isActive).toList();

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (active.isNotEmpty) ...[
                    Text('Consulta ativa', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 12),
                    for (final consultation in active) ...[
                      AppointmentCard(
                        consultation: consultation,
                        // Em andamento quem encerra é o médico; "Desmarcar" aqui cancelava a
                        // consulta no meio do atendimento.
                        onCancel: consultation.status == ConsultationStatus.inProgress ? null : () => _cancel(consultation),
                        primaryLabel: primaryActionLabel(consultation),
                        onPrimary: () => _openActive(consultation),
                      ),
                      const SizedBox(height: 12),
                    ],
                    const SizedBox(height: 12),
                  ],
                  Text('Histórico', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  if (history.isEmpty)
                    Card(
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Nenhuma consulta realizada ainda.'),
                      ),
                    )
                  else
                    for (final consultation in history)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _HistoryTile(
                          consultation: consultation,
                          onTap: () => _openDetail(consultation),
                        ),
                      ),
                ],
              );
            },
          ),
        ],
    );
  }
}

class _NewConsultationCard extends StatelessWidget {
  const _NewConsultationCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.cardLarge),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: context.colors.brand500.withValues(alpha: 0.12),
                child: Icon(
                  Icons.add_circle_outline,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Nova consulta', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(
                      kQueueEnabled
                          ? 'Fale com um médico agora ou agende um horário'
                          : 'Escolha o médico e o horário',
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: context.colors.gray400),
            ],
          ),
        ),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({required this.consultation, required this.onTap});

  final Consultation consultation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.cardLarge),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      consultation.doctor != null
                          ? doctorTitle(consultation.doctor!.name)
                          : 'Consulta',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      consultation.status.label,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: context.colors.gray400),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry, required this.error});

  final VoidCallback onRetry;
  final String error;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, size: 48, color: context.colors.danger500),
            const SizedBox(height: 12),
            const Text('Não foi possível carregar suas consultas.'),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: onRetry, child: const Text('Tentar de novo')),
          ],
        ),
      ),
    );
  }
}
