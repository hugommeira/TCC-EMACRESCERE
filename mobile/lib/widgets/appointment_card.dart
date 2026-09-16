import 'package:flutter/material.dart';

import '../models/consultation.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// Card de consulta ativa/agendada — reutilizado na Home e na aba
/// Consultas. Mostra o status, o médico (ou "aguardando") e a data.
class AppointmentCard extends StatelessWidget {
  const AppointmentCard({
    super.key,
    required this.consultation,
    this.onCancel,
    this.onPrimary,
    this.primaryLabel = 'Ver mais',
  });

  final Consultation consultation;

  /// Se nulo, o botão "Desmarcar" não aparece.
  final VoidCallback? onCancel;
  final VoidCallback? onPrimary;
  final String primaryLabel;

  /// Dois botões lado a lado em 320px: o padding horizontal padrão (24)
  /// quebrava "Desmarcar" em duas linhas.
  static final _compact = ButtonStyle(
    padding: WidgetStateProperty.all(const EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
  );

  @override
  Widget build(BuildContext context) {
    final doctor = consultation.doctor;
    final doctorLabel = doctor != null ? doctorTitle(doctor.name) : 'Aguardando médico';
    final dateLabel = consultation.scheduledAt != null
        ? formatDateTime(consultation.scheduledAt!)
        : formatDate(consultation.displayDate);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.medical_services_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    doctorLabel,
                    style: Theme.of(context).textTheme.titleMedium,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                _StatusChip(consultation: consultation),
              ],
            ),
            const SizedBox(height: 16),
            _IconTextRow(icon: Icons.calendar_today_outlined, text: dateLabel),
            const SizedBox(height: 8),
            _IconTextRow(
              icon: consultation.isOnDemand ? Icons.bolt_outlined : Icons.schedule_outlined,
              text: consultation.isOnDemand ? 'Atendimento imediato (fila)' : 'Horário marcado',
            ),
            if (onCancel != null || onPrimary != null) ...[
              const SizedBox(height: 20),
              Row(
                children: [
                  if (onCancel != null) ...[
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onCancel,
                        style: _compact,
                        child: const Text('Desmarcar'),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  if (onPrimary != null)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: onPrimary,
                        style: _compact,
                        child: Text(primaryLabel),
                      ),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _IconTextRow extends StatelessWidget {
  const _IconTextRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

/// Pill de status com cor por estado: em andamento = esmeralda cheio,
/// aguardando pagamento = âmbar, na fila = azul-petróleo, agendada = menta.
class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.consultation});

  final Consultation consultation;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = consultation.isAwaitingPayment
        ? (AppColors.warning500.withValues(alpha: 0.15), const Color(0xFF92400E))
        : switch (consultation.status) {
            ConsultationStatus.inProgress => (AppColors.brand600, Colors.white),
            ConsultationStatus.waiting => (AppColors.teal400.withValues(alpha: 0.2), AppColors.teal600),
            _ => (AppColors.brand100, AppColors.brand800),
          };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppRadius.pill)),
      child: Text(
        consultation.displayLabel,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }
}
