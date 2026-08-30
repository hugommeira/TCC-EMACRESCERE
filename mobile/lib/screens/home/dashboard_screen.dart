import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/curved_header_scaffold.dart';

const _kQuickAccessCardHeight = 160.0;

/// Home/Dashboard. Nome/avatar do usuário vêm da sessão real
/// (AuthService.checkSession()). O resto dos cards é mockado — ver
/// TODOs pra onde plugar cada chamada de API real (endpoints ainda não
/// confirmados).
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  SessionUser? _user;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.checkSession();
    if (mounted) setState(() => _user = user);
  }

  @override
  Widget build(BuildContext context) {
    return CurvedHeaderScaffold(
      user: _user,
      overlapCard: const _QuickAccessCard(),
      overlapCardHeight: _kQuickAccessCardHeight,
      children: [
        AppointmentCard(
          title: 'Horário foi pré-agendado',
          modality: 'Videoconferência',
          dateTimeLabel: '09:00 · 19/06/2023',
          onCancel: () {
            // TODO(api): cancelar consulta — provavelmente
            // api/consultations/[id]/cancel.
          },
          onViewMore: () {
            // TODO(api): abrir detalhes da consulta.
          },
        ),
        const SizedBox(height: 20),
        const _MealPlanSection(),
        const SizedBox(height: 20),
        const _DiaryUpdatesSection(),
      ],
    );
  }
}

class _QuickAccessCard extends StatelessWidget {
  const _QuickAccessCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Acesso Rápido', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _QuickAccessItem(
                  icon: Icons.monitor_weight_outlined,
                  label: 'Peso',
                  onTap: () {
                    // TODO(api): abrir tela de registro de peso — já
                    // existe em lib/screens/tracking/tracking_screen.dart,
                    // falta navegar pra aba Acompanhamento a partir daqui.
                  },
                ),
                _QuickAccessItem(
                  icon: Icons.medical_services_outlined,
                  label: 'Consulta',
                  onTap: () {
                    // TODO(api): iniciar fluxo de fila/consulta —
                    // provavelmente api/queue/enter, a confirmar.
                  },
                ),
                _QuickAccessItem(
                  icon: Icons.chat_bubble_outline,
                  label: 'Chat',
                  onTap: () {
                    // TODO(api): abrir chat da consulta ativa —
                    // api/chat/[roomToken], a confirmar.
                  },
                ),
                _QuickAccessItem(
                  icon: Icons.description_outlined,
                  label: 'Receitas',
                  onTap: () {
                    // TODO(api): abrir lista de prescrições —
                    // api/prescriptions.
                  },
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.brand500.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Theme.of(context).colorScheme.primary, size: 22),
            ),
            const SizedBox(height: 6),
            Text(label, style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }
}

// TODO(api): substituir pelo dado real de GET api/consultations (próxima
// consulta agendada do paciente logado). Enquanto não houver consulta,
// mostrar estado vazio em vez desse mock. Usada via widgets/appointment_card.dart.

class _MealPlanSection extends StatelessWidget {
  const _MealPlanSection();

  @override
  Widget build(BuildContext context) {
    // TODO(api): substituir pelo plano alimentar real do paciente —
    // endpoint ainda não identificado no backend.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Plano alimentar', style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            TextButton(onPressed: () {}, child: const Text('Ver mais')),
          ],
        ),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Lanche da tarde',
                        style: Theme.of(context)
                            .textTheme
                            .bodyLarge
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    Text('16:30', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Banana (1 unidade média · 75g) · Canela em pó (1 colher de chá · 2g)',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: SizedBox(
                    height: 36,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        textStyle: const TextStyle(fontSize: 13),
                      ),
                      onPressed: () {
                        // TODO(api): registrar refeição consumida.
                      },
                      child: const Text('Registrar'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _DiaryUpdatesSection extends StatelessWidget {
  const _DiaryUpdatesSection();

  @override
  Widget build(BuildContext context) {
    // TODO(api): substituir pela lista real de atualizações do diário —
    // endpoint ainda não identificado no backend.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Atualizações do seu diário', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              'Nenhuma atualização por enquanto.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      ],
    );
  }
}
