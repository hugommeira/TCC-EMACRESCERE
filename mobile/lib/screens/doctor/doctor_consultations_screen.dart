import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import '../../services/auth_service.dart';
import '../../services/consultation_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/curved_header_scaffold.dart';
import 'doctor_room_screen.dart';
import 'doctor_shell.dart';

/// Consultas do médico (GET /api/consultations com role DOCTOR devolve as
/// dele): em andamento primeiro, depois agendadas e histórico.
class DoctorConsultationsScreen extends StatefulWidget {
  const DoctorConsultationsScreen({super.key});

  @override
  State<DoctorConsultationsScreen> createState() => _DoctorConsultationsScreenState();
}

class _DoctorConsultationsScreenState extends State<DoctorConsultationsScreen> {
  SessionUser? _user;
  late Future<List<Consultation>> _future;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _future = ConsultationService.getConsultations(limit: 50);
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _reload() async {
    setState(() { _future = ConsultationService.getConsultations(limit: 50); });
    await _future;
  }

  Future<void> _open(Consultation c) async {
    // Sempre a sala do médico: em andamento atende; agendada tem o botão
    // 'Iniciar'; encerrada mostra prontuário/chat como histórico. A tela de
    // detalhe é a do paciente (mostrava o próprio médico como 'Dr. ...').
    final screen = DoctorRoomScreen(consultationId: c.id);
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
    if (mounted) await _reload();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return CurvedHeaderScaffold(
      user: _user,
      headerTitle: doctorHeaderTitle(_user?.name),
      onRefresh: _reload,
      overlapCard: FutureBuilder<List<Consultation>>(
        future: _future,
        builder: (context, snapshot) {
          final all = snapshot.data ?? [];
          final today = all.where((c) => _isToday(c.displayDate)).length;
          final done = all.where((c) => c.status == ConsultationStatus.completed).length;
          return _StatsCard(today: today, completed: done, loading: !snapshot.hasData);
        },
      ),
      children: [
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
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text('Não foi possível carregar: ${snapshot.error}', textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _reload, child: const Text('Tentar de novo')),
                    ],
                  ),
                ),
              );
            }

            final all = snapshot.data ?? [];
            final inProgress = all.where((c) => c.status == ConsultationStatus.inProgress).toList();
            final scheduled = all.where((c) => c.status == ConsultationStatus.scheduled && !c.isOnDemand).toList()
              ..sort((a, b) => a.displayDate.compareTo(b.displayDate));
            final history = all
                .where((c) => !c.status.isActive)
                .toList()
              ..sort((a, b) => b.displayDate.compareTo(a.displayDate));

            if (all.isEmpty) {
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Você ainda não atendeu ninguém.', style: textTheme.bodyMedium),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => DoctorTabScope.maybeOf(context)?.select(DoctorTab.queue),
                        child: const Text('Ver a fila'),
                      ),
                    ],
                  ),
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (inProgress.isNotEmpty) ...[
                  Text('Em andamento', style: textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final c in inProgress) _Tile(consultation: c, highlight: true, onTap: () => _open(c)),
                  const SizedBox(height: 12),
                ],
                if (scheduled.isNotEmpty) ...[
                  Text('Agendadas', style: textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final c in scheduled) _Tile(consultation: c, onTap: () => _open(c)),
                  const SizedBox(height: 12),
                ],
                if (history.isNotEmpty) ...[
                  Text('Histórico', style: textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final c in history) _Tile(consultation: c, onTap: () => _open(c)),
                ],
              ],
            );
          },
        ),
      ],
    );
  }

  static bool _isToday(DateTime d) {
    final now = DateTime.now();
    final l = d.toLocal();
    return l.year == now.year && l.month == now.month && l.day == now.day;
  }
}

class _StatsCard extends StatelessWidget {
  const _StatsCard({required this.today, required this.completed, required this.loading});

  final int today;
  final int completed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    Widget stat(String label, int value) => Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: textTheme.labelMedium),
              const SizedBox(height: 4),
              Text(loading ? '–' : '$value', style: textTheme.headlineMedium),
            ],
          ),
        );

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            stat('Hoje', today),
            Container(width: 1, height: 44, color: AppColors.brand100),
            const SizedBox(width: 16),
            stat('Concluídas', completed),
          ],
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.consultation, required this.onTap, this.highlight = false});

  final Consultation consultation;
  final VoidCallback onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final c = consultation;
    final when = c.scheduledAt != null ? formatDateTime(c.scheduledAt!) : formatDateTime(c.displayDate);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        shape: highlight
            ? RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.cardLarge),
                side: const BorderSide(color: AppColors.brand500, width: 1.5),
              )
            : null,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.cardLarge),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: highlight ? AppColors.brandGradient : AppColors.brandGradientSoft,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    c.isOnDemand ? Icons.bolt_rounded : Icons.event_rounded,
                    color: highlight ? Colors.white : AppColors.brand700,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.patient?.name ?? 'Paciente', style: textTheme.titleMedium, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text('${c.status.label} · $when', style: textTheme.bodySmall),
                      if ((c.chiefComplaint ?? '').isNotEmpty)
                        Text(c.chiefComplaint!, style: textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.gray400),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
