import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import '../../models/weight_entry.dart';
import '../../services/auth_service.dart';
import '../../services/consultation_service.dart';
import '../../services/weight_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/motion.dart';
import '../../widgets/sparkline.dart';
import '../../widgets/ui.dart';
import '../consultations/consultation_actions.dart';
import '../consultations/consultation_detail_screen.dart';
import '../consultations/schedule/schedule_screen.dart';
import '../shell/main_shell.dart';
import '../shell/tab_visibility.dart';

/// Prancheta "2 · Início (paciente)": header verde com o coração 3D, a
/// próxima consulta (GET /api/consultations), atalhos e o progresso de peso
/// (GET /api/weight).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with TabVisibilityMixin<DashboardScreen> {
  @override
  ShellTab get tab => ShellTab.home;

  // Aba voltou a aparecer: atualiza sem trocar a tela por um spinner.
  @override
  void onTabShown() => _refreshSilently();

  SessionUser? _user;
  late Future<List<Consultation>> _future;
  WeightHistory? _weight;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _future = ConsultationService.getConsultations();
    _loadWeight();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _loadWeight() async {
    try {
      final history = await WeightService.getHistory();
      if (mounted) setState(() => _weight = history);
    } catch (_) {
      // Sem peso o cartão de progresso mostra o estado vazio.
    }
  }

  Future<void> _refreshSilently() async {
    try {
      final data = await ConsultationService.getConsultations();
      if (mounted) setState(() { _future = Future.value(data); });
    } catch (_) {
      // mantém o que tinha; o pull-to-refresh mostra o erro se persistir
    }
    await _loadWeight();
  }

  Future<void> _reload() async {
    setState(() { _future = ConsultationService.getConsultations(); });
    await Future.wait([_future.then((_) {}), _loadWeight()]);
  }

  void _goTo(ShellTab tab) => ShellTabScope.maybeOf(context)?.select(tab);

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

  /// "Receitas" abre a consulta mais recente que tem prescrição.
  Future<void> _openLatestPrescription() async {
    List<Consultation> consultations;
    try {
      consultations = await _future;
    } catch (_) {
      consultations = const [];
    }
    final withPrescription = consultations.where((c) => c.prescriptionId != null).toList()
      ..sort((a, b) => b.displayDate.compareTo(a.displayDate));
    if (!mounted) return;
    if (withPrescription.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Você ainda não tem receitas.')),
      );
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ConsultationDetailScreen(consultationId: withPrescription.first.id),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final statusBar = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final firstName = _user?.name?.split(' ').first ?? '';

    return Scaffold(
      backgroundColor: ds.bg,
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          padding: EdgeInsets.zero,
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            FutureBuilder<List<Consultation>>(
              future: _future,
              builder: (context, snapshot) {
                final next = snapshot.hasData ? _pickNext(snapshot.data!) : null;
                return Stack(
                  children: [
                    _Hero(
                      statusBar: statusBar,
                      name: _user?.name ?? '',
                      firstName: firstName,
                      // Lembrete: o ponto do sino pulsa quando a próxima
                      // consulta é em até 24 h.
                      remind: next != null &&
                          next.displayDate.difference(DateTime.now()).inHours < 24,
                      onBell: () => _goTo(ShellTab.chat),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(18, statusBar + 196, 18, 24 + bottom),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Rise(
                            child: _NextConsultationCard(
                              loading: snapshot.connectionState == ConnectionState.waiting,
                              error: snapshot.hasError,
                              consultation: next,
                              onOpen: next == null ? null : () => _openActive(next),
                              onSchedule: _openSchedule,
                              onRetry: _reload,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Rise(
                            delay: const Duration(milliseconds: 70),
                            child: Row(
                              children: [
                                _QuickAction(
                                  icon: Icons.monitor_weight_outlined,
                                  label: 'Peso',
                                  onTap: () => _goTo(ShellTab.tracking),
                                ),
                                const SizedBox(width: 10),
                                _QuickAction(icon: Icons.edit_calendar_outlined, label: 'Agendar', onTap: _openSchedule),
                                const SizedBox(width: 10),
                                _QuickAction(
                                  icon: Icons.chat_bubble_outline_rounded,
                                  label: 'Chat',
                                  onTap: () => _goTo(ShellTab.chat),
                                ),
                                const SizedBox(width: 10),
                                _QuickAction(
                                  icon: Icons.description_outlined,
                                  label: 'Receitas',
                                  onTap: _openLatestPrescription,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          Rise(
                            delay: const Duration(milliseconds: 140),
                            child: _ProgressCard(history: _weight, onTap: () => _goTo(ShellTab.tracking)),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
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

/// Header verde de 252 px com bordas inferiores de 36 px.
class _Hero extends StatelessWidget {
  const _Hero({
    required this.statusBar,
    required this.name,
    required this.firstName,
    required this.remind,
    required this.onBell,
  });

  final double statusBar;
  final String name;
  final String firstName;
  final bool remind;
  final VoidCallback onBell;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(36)),
      child: Container(
        height: statusBar + 252,
        decoration: BoxDecoration(gradient: context.colors.headerGradient),
        child: Stack(
          children: [
            const Positioned(
              right: -70,
              top: -80,
              child: DriftBlob(size: 260, color: Color(0x8C6EE7B7), dx: -40, dy: 20),
            ),
            Positioned(
              right: -18,
              top: statusBar + 26,
              child: const Opacity(opacity: 0.9, child: FloatingLogo3D(size: 150, groundShadow: false, glow: false)),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(24, statusBar + 26, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 1.5),
                        ),
                        child: Text(
                          name.isEmpty ? '' : InitialsTile.initialsOf(name),
                          style: const TextStyle(fontFamily: AppType.sans, color: Colors.white, fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Semantics(
                        button: true,
                        label: 'Conversas',
                        excludeSemantics: true,
                        child: Material(
                          color: Colors.white.withValues(alpha: 0.16),
                          shape: const CircleBorder(),
                          child: InkWell(
                            onTap: onBell,
                            customBorder: const CircleBorder(),
                            child: SizedBox(
                              width: 44,
                              height: 44,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 22),
                                  if (remind) const Positioned(top: 10, right: 11, child: PulseDot()),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const Spacer(),
                      const ThemeToggle(onHero: true),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    greetingForNow(),
                    style: const TextStyle(fontFamily: AppType.sans, color: Color(0xFFD1FAE5), fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    firstName.isEmpty ? '...' : firstName,
                    style: AppType.title(34, Colors.white, height: 1.05),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NextConsultationCard extends StatelessWidget {
  const _NextConsultationCard({
    required this.loading,
    required this.error,
    required this.consultation,
    required this.onOpen,
    required this.onSchedule,
    required this.onRetry,
  });

  final bool loading;
  final bool error;
  final Consultation? consultation;
  final VoidCallback? onOpen;
  final VoidCallback onSchedule;
  final VoidCallback onRetry;

  static const _weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final c = consultation;

    if (loading) {
      return const DsCard(
        shadow: true,
        child: SizedBox(height: 168, child: Center(child: CircularProgressIndicator())),
      );
    }

    if (c == null) {
      return DsCard(
        shadow: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('PRÓXIMA CONSULTA', style: AppType.eyebrow(ds.link)),
            const SizedBox(height: 12),
            Text(
              error ? 'Não foi possível carregar suas consultas.' : 'Você não tem consulta marcada.',
              style: TextStyle(fontFamily: AppType.sans, fontSize: 17, fontWeight: FontWeight.w700, color: ds.title),
            ),
            const SizedBox(height: 4),
            Text(
              error ? 'Puxe a tela para baixo ou tente de novo.' : 'Escolha o médico e o horário que preferir.',
              style: TextStyle(fontFamily: AppType.sans, fontSize: 14, color: ds.muted),
            ),
            const SizedBox(height: 14),
            ShineButton(label: error ? 'Tentar de novo' : 'Agendar consulta', onPressed: error ? onRetry : onSchedule),
          ],
        ),
      );
    }

    final when = c.displayDate.toLocal();
    final doctor = doctorTitle(c.doctor?.name);
    final (chipLabel, chipBg, chipFg) = _chip(context, c);

    return DsCard(
      shadow: true,
      onTap: onOpen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(child: Text('PRÓXIMA CONSULTA', style: AppType.eyebrow(ds.link))),
              DsChip(label: chipLabel, bg: chipBg, fg: chipFg),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              InitialsTile(name: c.doctor?.name ?? 'Médico'),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.isEmpty ? 'Médico' : doctor,
                      style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, fontSize: 17, color: ds.title),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      (c.chiefComplaint ?? '').trim().isEmpty ? 'Consulta com hora marcada' : c.chiefComplaint!.trim(),
                      style: TextStyle(fontFamily: AppType.sans, fontSize: 14, color: ds.muted),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _MiniStat(
                  label: '${_weekdays[when.weekday - 1]}, ${formatDate(when).substring(0, 5)}',
                  value: formatTime(when),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(child: _MiniStat(label: _countdownLabel(c), value: _countdown(c))),
            ],
          ),
        ],
      ),
    );
  }

  static (String, Color?, Color?) _chip(BuildContext context, Consultation c) {
    final p = c.payment;
    if (c.status == ConsultationStatus.inProgress) return ('Em andamento', AppColors.brand600, Colors.white);
    if (p != null && p.isPaid) return ('Pagamento confirmado', null, null);
    if (p != null && p.isPending) return ('Aguardando pagamento', context.colors.warningBg, context.colors.warningFg);
    return (c.status.label, null, null);
  }

  static String _countdownLabel(Consultation c) =>
      c.status == ConsultationStatus.inProgress ? 'Agora' : 'Começa em';

  /// "2 dias", "amanhã", "3 h", "40 min".
  static String _countdown(Consultation c) {
    if (c.status == ConsultationStatus.inProgress) return 'Entrar';
    final diff = c.displayDate.difference(DateTime.now());
    if (diff.isNegative) return 'Agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min';
    if (diff.inHours < 24) return '${diff.inHours} h';
    final days = DateTime(c.displayDate.toLocal().year, c.displayDate.toLocal().month, c.displayDate.toLocal().day)
        .difference(DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day))
        .inDays;
    if (days <= 1) return 'amanhã';
    return '$days dias';
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: ds.soft, borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.muted), maxLines: 1),
          const SizedBox(height: 2),
          Text(value, style: AppType.title(22, ds.title, height: 1.2)),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Expanded(
      child: DsCard(
        radius: 20,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 14),
        onTap: onTap,
        child: Column(
          children: [
            IconTile(icon: icon),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(fontFamily: AppType.sans, fontSize: 13, fontWeight: FontWeight.w600, color: ds.text),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// Cartão verde-escuro "Seu progresso": variação desde a primeira pesagem,
/// meta e a linha da evolução.
class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.history, required this.onTap});

  final WeightHistory? history;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final entries = history?.entries ?? const <WeightEntry>[];
    final goal = history?.summary.goalWeightKg;
    final delta = entries.length >= 2 ? entries.last.weightKg - entries.first.weightKg : null;

    return DsCard(
      color: ds.feature,
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            Positioned(
              left: -40,
              bottom: -80,
              child: Container(
                width: 220,
                height: 220,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(colors: [Color(0x7310B981), Color(0x0010B981)], stops: [0, 0.7]),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Seu progresso',
                              style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: Color(0xFFA7F3D0)),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              delta == null ? '—' : '${delta <= 0 ? '−' : '+'}${formatDecimal(delta.abs())} kg',
                              style: AppType.title(30, Colors.white, height: 1.15),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              entries.isEmpty
                                  ? 'Registre sua primeira pesagem'
                                  : entries.length == 1
                                      ? 'Registre outra pesagem para ver a variação'
                                      : 'desde a primeira pesagem',
                              style: const TextStyle(fontFamily: AppType.sans, fontSize: 13, color: Color(0xFFD1FAE5)),
                            ),
                          ],
                        ),
                      ),
                      if (goal != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.leaf.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            'Meta ${formatDecimal(goal)} kg',
                            style: const TextStyle(
                              fontFamily: AppType.sans,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFC7EFA6),
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (entries.length >= 2) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 70,
                      child: Sparkline(values: [for (final e in entries) e.weightKg]),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
