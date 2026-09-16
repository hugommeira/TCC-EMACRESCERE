import 'package:flutter/material.dart';

import '../../../models/consultation.dart';
import '../../../services/auth_service.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/formatters.dart';
import '../../../widgets/curved_header_scaffold.dart';
import '../../shell/main_shell.dart';
import '../../shell/tab_visibility.dart';
import 'chat_screen.dart';

/// Aba Chat: lista as consultas que têm sala de chat (roomToken) e abre a
/// conversa. Não existe "chat avulso" no backend — toda conversa pertence
/// a uma consulta — então sem consulta a aba orienta a marcar uma.
class ChatTabScreen extends StatefulWidget {
  const ChatTabScreen({super.key});

  @override
  State<ChatTabScreen> createState() => _ChatTabScreenState();
}

class _ChatTabScreenState extends State<ChatTabScreen> with TabVisibilityMixin<ChatTabScreen> {
  @override
  ShellTab get tab => ShellTab.chat;

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

  void _openChat(Consultation consultation) {
    final doctor = consultation.doctor;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ChatScreen(
          roomToken: consultation.roomToken!,
          title: doctor != null ? doctorTitle(doctor.name) : 'Chat da consulta',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return CurvedHeaderScaffold(
      user: _user,
      onRefresh: _reload,
      overlapCard: const _IntroCard(),
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
              return _EmptyCard(
                icon: Icons.error_outline,
                text: 'Não foi possível carregar suas conversas.',
                actionLabel: 'Tentar de novo',
                onAction: _reload,
              );
            }

            final rooms = (snapshot.data ?? []).where((c) => c.roomToken != null).toList()
              ..sort((a, b) => b.displayDate.compareTo(a.displayDate));
            final active = rooms.where((c) => c.status.isActive).toList();
            final past = rooms.where((c) => !c.status.isActive).toList();

            if (rooms.isEmpty) {
              return _EmptyCard(
                icon: Icons.chat_bubble_outline,
                text: 'Seu chat com o médico aparece aqui assim que houver uma consulta.',
                actionLabel: 'Marcar consulta',
                onAction: () => ShellTabScope.maybeOf(context)?.select(ShellTab.consultations),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (active.isNotEmpty) ...[
                  Text('Conversas ativas', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final c in active) _RoomTile(consultation: c, onTap: () => _openChat(c)),
                  const SizedBox(height: 12),
                ],
                if (past.isNotEmpty) ...[
                  Text('Consultas anteriores', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  for (final c in past) _RoomTile(consultation: c, onTap: () => _openChat(c)),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _IntroCard extends StatelessWidget {
  const _IntroCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.brand500.withValues(alpha: 0.12),
              child: Icon(Icons.chat_bubble_outline, color: Theme.of(context).colorScheme.primary),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Fale com seu médico', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 2),
                  Text(
                    'Cada consulta tem sua própria conversa.',
                    style: Theme.of(context).textTheme.bodySmall,
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

class _RoomTile extends StatelessWidget {
  const _RoomTile({required this.consultation, required this.onTap});

  final Consultation consultation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final doctor = consultation.doctor;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.cardLarge),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.brand500.withValues(alpha: 0.12),
                  child: Icon(Icons.person_outline, color: Theme.of(context).colorScheme.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor != null ? doctorTitle(doctor.name) : 'Aguardando médico',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${consultation.status.label} · ${formatDate(consultation.displayDate)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
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

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
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
