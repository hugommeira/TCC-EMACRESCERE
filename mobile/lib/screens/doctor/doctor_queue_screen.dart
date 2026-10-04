import 'dart:async';

import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../services/doctor_service.dart';
import '../../utils/formatters.dart';
import '../../theme/app_theme.dart';
import '../../widgets/curved_header_scaffold.dart';
import 'doctor_room_screen.dart';

/// Fila de atendimento como o médico vê (GET /api/queue/list): pacientes
/// que pagaram e esperam. "Atender" faz o claim atômico
/// (POST /api/queue/claim) e abre a sala. Polling de 8s, como o site.
class DoctorQueueScreen extends StatefulWidget {
  const DoctorQueueScreen({super.key});

  @override
  State<DoctorQueueScreen> createState() => _DoctorQueueScreenState();
}

class _DoctorQueueScreenState extends State<DoctorQueueScreen> {
  SessionUser? _user;
  List<QueueItem> _items = [];
  bool _loading = true;
  String? _error;
  String? _claiming;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 8), (_) => _refresh(silent: true));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final items = await DoctorService.listQueue();
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
        _error = null;
      });
    } on DoctorFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = silent ? _error : 'Não foi possível carregar a fila: $e';
      });
    }
  }

  Future<void> _claim(QueueItem item) async {
    setState(() => _claiming = item.consultationId);
    try {
      final id = await DoctorService.claim(item.consultationId);
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => DoctorRoomScreen(consultationId: id)),
      );
    } on DoctorFailure catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) {
        setState(() => _claiming = null);
        _refresh(silent: true);
      }
    }
  }

  String get _headerTitle => doctorHeaderTitle(_user?.name);

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return CurvedHeaderScaffold(
      user: _user,
      headerTitle: _headerTitle,
      onRefresh: () => _refresh(silent: true),
      overlapCard: _QueueSummaryCard(count: _items.length, loading: _loading),
      children: [
        if (_error != null)
          _Notice(text: _error!, icon: Icons.error_outline, danger: true)
        else if (_loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_items.isEmpty)
          const _Notice(
            text: 'Nenhum paciente na fila agora. A lista atualiza sozinha a cada 8 segundos.',
            icon: Icons.hourglass_empty_rounded,
          )
        else ...[
          Text('Aguardando atendimento', style: textTheme.titleMedium),
          const SizedBox(height: 12),
          for (var i = 0; i < _items.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _QueueCard(
                item: _items[i],
                position: i + 1,
                claiming: _claiming == _items[i].consultationId,
                disabled: _claiming != null,
                onClaim: () => _claim(_items[i]),
              ),
            ),
        ],
      ],
    );
  }
}

class _QueueSummaryCard extends StatelessWidget {
  const _QueueSummaryCard({required this.count, required this.loading});

  final int count;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                    )
                  : Text(
                      '$count',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                    ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    count == 1 ? '1 paciente na fila' : '$count pacientes na fila',
                    style: textTheme.titleMedium,
                  ),
                  const SizedBox(height: 2),
                  Text('Pegue o próximo pra iniciar o atendimento.', style: textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QueueCard extends StatelessWidget {
  const _QueueCard({
    required this.item,
    required this.position,
    required this.claiming,
    required this.disabled,
    required this.onClaim,
  });

  final QueueItem item;
  final int position;
  final bool claiming;
  final bool disabled;
  final VoidCallback onClaim;

  String _waitingLabel() {
    final m = item.waiting.inMinutes;
    if (m < 1) return 'agora';
    if (m < 60) return '$m min';
    return '${item.waiting.inHours}h ${m % 60}min';
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final meta = [
      if (item.age != null) '${item.age} anos',
      if (item.gender != null && item.gender!.isNotEmpty) item.gender!,
    ].join(' · ');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    gradient: context.colors.softGradient,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.colors.brand100),
                  ),
                  child: Text('$position', style: textTheme.titleMedium),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.patientName, style: textTheme.titleMedium, overflow: TextOverflow.ellipsis),
                      if (meta.isNotEmpty) Text(meta, style: textTheme.bodySmall),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: context.colors.brand100,
                    borderRadius: BorderRadius.circular(AppRadius.pill),
                  ),
                  child: Text(
                    'espera ${_waitingLabel()}',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: context.colors.brand800),
                  ),
                ),
              ],
            ),
            if ((item.chiefComplaint ?? '').isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Queixa', style: textTheme.labelMedium),
              const SizedBox(height: 2),
              Text(item.chiefComplaint!, style: textTheme.bodyMedium, maxLines: 3, overflow: TextOverflow.ellipsis),
            ],
            if (item.allergies.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded, size: 16, color: context.colors.warning500),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Alergias: ${item.allergies.join(', ')}',
                      style: textTheme.bodySmall?.copyWith(color: context.colors.warningFg),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: disabled ? null : onClaim,
              icon: claiming
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.play_arrow_rounded, size: 20),
              label: Text(claiming ? 'Iniciando…' : 'Atender'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text, required this.icon, this.danger = false});

  final String text;
  final IconData icon;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(icon, color: danger ? context.colors.danger600 : context.colors.brand600),
            const SizedBox(width: 12),
            Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
          ],
        ),
      ),
    );
  }
}
