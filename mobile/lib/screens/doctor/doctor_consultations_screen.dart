import 'package:flutter/material.dart';

import '../../constants.dart';
import '../../models/consultation.dart';
import '../../services/auth_service.dart';
import '../../services/consultation_service.dart';
import '../../services/doctor_service.dart';
import '../../models/doctor_profile.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/motion.dart';
import '../../widgets/ui.dart';
import 'doctor_room_screen.dart';
import 'doctor_shell.dart';

/// Prancheta "6 · Início (médica)": disponibilidade, números do dia e as
/// consultas (GET /api/consultations com role DOCTOR devolve as dele) — em
/// andamento e agendadas primeiro, depois o histórico.
class DoctorConsultationsScreen extends StatefulWidget {
  const DoctorConsultationsScreen({super.key});

  @override
  State<DoctorConsultationsScreen> createState() => _DoctorConsultationsScreenState();
}

class _DoctorConsultationsScreenState extends State<DoctorConsultationsScreen> {
  SessionUser? _user;
  late Future<List<Consultation>> _future;
  DoctorProfile? _profile;
  bool _toggling = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _loadProfile();
    _future = ConsultationService.getConsultations(limit: 50);
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await DoctorService.getProfile();
      if (mounted) setState(() => _profile = profile);
    } catch (_) {
      // Sem perfil o cartão de disponibilidade fica escondido.
    }
  }

  Future<void> _setAvailable(bool value) async {
    setState(() => _toggling = true);
    try {
      final updated = await DoctorService.setAvailable(value);
      if (mounted) setState(() => _profile = updated);
    } on DoctorFailure catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _reload() async {
    setState(() {
      _future = ConsultationService.getConsultations(limit: 50);
    });
    await Future.wait([_future.then((_) {}), _loadProfile()]);
  }

  Future<void> _open(Consultation c) async {
    // Sempre a sala do médico: em andamento atende; agendada tem o botão
    // 'Iniciar'; encerrada mostra prontuário/chat como histórico. A tela de
    // detalhe é a do paciente (mostrava o próprio médico como 'Dr. ...').
    final screen = DoctorRoomScreen(consultationId: c.id);
    await Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
    if (mounted) await _reload();
  }

  /// "Dra. Fernanda" quando o nome cadastrado já traz o título; senão
  /// "Dr(a). Fernanda".
  static String _greetName(String? fullName) {
    final n = (fullName ?? '').trim();
    if (n.isEmpty) return '...';
    final m = RegExp(r'^(dr\.?a?\.?)\s+(\S+)', caseSensitive: false).firstMatch(n);
    if (m != null) {
      final t = m.group(1)!.toLowerCase().replaceAll('.', '');
      return '${t == 'dra' ? 'Dra.' : 'Dr.'} ${m.group(2)}';
    }
    return 'Dr(a). ${n.split(' ').first}';
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final dark = context.colors.isDark;
    final statusBar = MediaQuery.paddingOf(context).top;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final profile = _profile;

    return Scaffold(
      backgroundColor: ds.bg,
      body: Stack(
        children: [
          Positioned(
            left: -120,
            top: -120,
            child: DriftBlob(
              size: 340,
              color: dark ? const Color(0x5910B981) : const Color(0xE6A7F3D0),
              dx: 40,
              dy: 30,
            ),
          ),
          Positioned(
            right: -30,
            top: statusBar + 40,
            child: Opacity(
              opacity: dark ? 0.55 : 0.35,
              child: const FloatingLogo3D(size: 140, orbits: false, glow: false),
            ),
          ),
          RefreshIndicator(
            onRefresh: _reload,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.fromLTRB(18, statusBar + 18, 18, 24 + bottom),
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                greetingForNow(),
                                style: TextStyle(fontFamily: AppType.sans, fontSize: 15, color: ds.muted),
                              ),
                              const SizedBox(height: 4),
                              Text(_greetName(_user?.name), style: AppType.title(32, ds.title, height: 1.05)),
                              if (profile != null) ...[
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Icon(Icons.verified_user_outlined, size: 16, color: dark ? ds.muted : ds.link),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        '${profile.crmLabel} · ${profile.isApproved ? 'credenciamento ativo' : 'em análise'}',
                                        style: TextStyle(
                                          fontFamily: AppType.sans,
                                          fontSize: 13,
                                          color: dark ? ds.muted : ds.link,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const ThemeToggle(),
                    ],
                  ),
                ),
                const SizedBox(height: 26),
                if (profile != null) ...[
                  Rise(
                    child: _AvailabilityCard(available: profile.available, busy: _toggling, onChanged: _setAvailable),
                  ),
                  const SizedBox(height: 14),
                ],
                FutureBuilder<List<Consultation>>(
                  future: _future,
                  builder: (context, snapshot) => _body(context, snapshot),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _body(BuildContext context, AsyncSnapshot<List<Consultation>> snapshot) {
    final ds = context.ds;
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (snapshot.hasError) {
      return DsCard(
        child: Column(
          children: [
            Text(
              'Não foi possível carregar: ${snapshot.error}',
              textAlign: TextAlign.center,
              style: TextStyle(color: ds.text),
            ),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _reload, child: const Text('Tentar de novo')),
          ],
        ),
      );
    }

    final all = snapshot.data ?? [];
    final upcoming =
        all
            .where(
              (c) =>
                  c.status == ConsultationStatus.inProgress ||
                  (c.status == ConsultationStatus.scheduled && !c.isOnDemand),
            )
            .toList()
          ..sort((a, b) {
            // Em andamento primeiro; depois por horário.
            final ai = a.status == ConsultationStatus.inProgress ? 0 : 1;
            final bi = b.status == ConsultationStatus.inProgress ? 0 : 1;
            return ai != bi ? ai - bi : a.displayDate.compareTo(b.displayDate);
          });
    final history = all.where((c) => !c.status.isActive).toList()
      ..sort((a, b) => b.displayDate.compareTo(a.displayDate));
    final today = all.where((c) => _isToday(c.displayDate) && c.status.isActive).length;
    final done = all.where((c) => c.status == ConsultationStatus.completed).length;
    final scheduledCount = upcoming.length;

    Widget sectionTitle(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        t,
        style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Rise(
          delay: const Duration(milliseconds: 80),
          child: Row(
            children: [
              Expanded(
                child: _Stat(label: 'Hoje', value: today),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Stat(label: 'Agendadas', value: scheduledCount),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Stat(label: 'Concluídas', value: done),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        if (all.isEmpty)
          DsCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  kQueueEnabled
                      ? 'Você ainda não atendeu ninguém.'
                      : 'Você ainda não atendeu ninguém. Os pacientes marcam o horário e a consulta aparece aqui.',
                  style: TextStyle(fontFamily: AppType.sans, color: ds.text, height: 1.45),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () =>
                      DoctorTabScope.maybeOf(context)?.select(kQueueEnabled ? DoctorTab.queue : DoctorTab.agenda),
                  child: Text(kQueueEnabled ? 'Ver a fila' : 'Ver a agenda'),
                ),
              ],
            ),
          )
        else
          Rise(
            delay: const Duration(milliseconds: 160),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (upcoming.isNotEmpty) ...[
                  sectionTitle('Próximas consultas'),
                  for (var i = 0; i < upcoming.length; i++) ...[
                    _ConsultationRow(
                      consultation: upcoming[i],
                      highlight: i == 0,
                      live:
                          upcoming[i].status == ConsultationStatus.inProgress ||
                          (i == 0 && _isToday(upcoming[i].displayDate)),
                      onTap: () => _open(upcoming[i]),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
                if (history.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  sectionTitle('Histórico'),
                  for (final c in history) ...[
                    _ConsultationRow(consultation: c, onTap: () => _open(c)),
                    const SizedBox(height: 10),
                  ],
                ],
              ],
            ),
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

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({required this.available, required this.busy, required this.onChanged});

  final bool available;
  final bool busy;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return DsCard(
      radius: 22,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  available ? 'Disponível para atender' : 'Indisponível',
                  style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
                ),
                const SizedBox(height: 3),
                Text(
                  available ? 'Pacientes podem marcar nos seus horários.' : 'Você não aparece para novos agendamentos.',
                  style: TextStyle(fontFamily: AppType.sans, fontSize: 13, height: 1.4, color: ds.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Semantics(
            toggled: available,
            label: 'Disponível para atender',
            button: true,
            excludeSemantics: true,
            child: GestureDetector(
              onTap: busy ? null : () => onChanged(!available),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: 54,
                height: 32,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  color: available ? AppColors.brand500 : context.colors.gray300,
                ),
                child: AnimatedAlign(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutBack,
                  alignment: available ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.all(4),
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.white),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return DsCard(
      radius: 20,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.muted),
          ),
          const SizedBox(height: 2),
          Text('$value', style: AppType.title(28, ds.title, height: 1.15)),
        ],
      ),
    );
  }
}

class _ConsultationRow extends StatelessWidget {
  const _ConsultationRow({required this.consultation, required this.onTap, this.highlight = false, this.live = false});

  final Consultation consultation;
  final VoidCallback onTap;
  final bool highlight;
  final bool live;

  static const _wd = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final dark = context.colors.isDark;
    final c = consultation;
    final when = c.displayDate.toLocal();
    final active = c.status.isActive;
    final subtitle = c.status == ConsultationStatus.inProgress
        ? 'Em andamento'
        : active
        ? ((c.chiefComplaint ?? '').trim().isEmpty ? 'Consulta agendada' : c.chiefComplaint!.trim())
        : '${c.status.label}${(c.chiefComplaint ?? '').trim().isEmpty ? '' : ' · ${c.chiefComplaint!.trim()}'}';
    final dateBg = dark ? const Color(0xFF163D33) : const Color(0xFFECFDF5);
    final dateFg = dark ? const Color(0xFFA7F3D0) : AppColors.brand700;
    final dateNum = dark ? Colors.white : AppColors.brand900;

    return DsCard(
      radius: 20,
      padding: const EdgeInsets.all(14),
      color: dark ? const Color(0xFF0F2A23) : ds.card,
      onTap: onTap,
      child: Opacity(
        opacity: active ? 1 : 0.85,
        child: Row(
          children: [
            Container(
              width: 58,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: highlight ? null : dateBg,
                gradient: highlight
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.brand700, AppColors.brand500],
                      )
                    : null,
              ),
              child: Column(
                children: [
                  Text(
                    '${_wd[when.weekday - 1]} ${when.day.toString().padLeft(2, '0')}',
                    style: TextStyle(
                      fontFamily: AppType.sans,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: highlight ? const Color(0xFFD1FAE5) : dateFg,
                    ),
                  ),
                  Text(formatTime(when), style: AppType.title(18, highlight ? Colors.white : dateNum, height: 1.25)),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    c.patient?.name ?? 'Paciente',
                    style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (live) PulseDot(color: dark ? AppColors.brand300 : AppColors.brand500, size: 10),
          ],
        ),
      ),
    );
  }
}
