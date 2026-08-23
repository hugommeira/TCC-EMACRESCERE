import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// Home/Dashboard. Dados mockados por enquanto — ver TODOs pra onde plugar
/// cada chamada de API real (endpoints ainda não confirmados).
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Início')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _NextConsultationCard(),
          const SizedBox(height: 12),
          _WeightReminderCard(),
          const SizedBox(height: 12),
          _NotificationsCard(),
          const SizedBox(height: 24),
          Text('Ações rápidas', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.monitor_weight_outlined,
                  label: 'Registrar peso',
                  onTap: () {
                    // TODO(api): abrir tela de registro de peso e enviar
                    // pra API quando o endpoint de acompanhamento existir.
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _QuickActionButton(
                  icon: Icons.medical_services_outlined,
                  label: 'Nova consulta',
                  onTap: () {
                    // TODO(api): iniciar fluxo de fila/consulta —
                    // provavelmente api/queue/enter, a confirmar.
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NextConsultationCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // TODO(api): substituir pelo dado real de GET api/consultations
    // (próxima consulta agendada do paciente logado).
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.brand100,
              child: Icon(Icons.calendar_month, color: AppColors.brand700),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Próxima consulta',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Nenhuma consulta agendada',
                    style: TextStyle(fontWeight: FontWeight.w600),
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

class _WeightReminderCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // TODO(api): substituir pelo dado real quando o endpoint de
    // acompanhamento de peso existir (verificar se já foi registrado
    // hoje/nesta semana).
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.warning500,
              foregroundColor: Colors.white,
              child: Icon(Icons.monitor_weight_outlined),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Lembrete',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Registre seu peso desta semana',
                    style: TextStyle(fontWeight: FontWeight.w600),
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

class _NotificationsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // TODO(api): substituir pela lista real de notificações do paciente
    // (endpoint ainda não identificado no backend).
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Notificações recentes', style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 8),
            const Text('Nenhuma notificação por enquanto.'),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Icon(icon, color: AppColors.brand600, size: 28),
              const SizedBox(height: 8),
              Text(label, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
