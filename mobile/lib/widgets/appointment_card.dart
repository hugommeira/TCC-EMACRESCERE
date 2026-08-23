import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Card de consulta agendada — reutilizado na Home e na aba Consultas.
class AppointmentCard extends StatelessWidget {
  const AppointmentCard({
    super.key,
    required this.title,
    required this.modality,
    required this.dateTimeLabel,
    this.onCancel,
    this.onViewMore,
  });

  final String title;
  final String modality;
  final String dateTimeLabel;
  final VoidCallback? onCancel;
  final VoidCallback? onViewMore;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 14),
            _IconTextRow(icon: Icons.videocam_outlined, text: modality),
            const SizedBox(height: 8),
            _IconTextRow(icon: Icons.calendar_today_outlined, text: dateTimeLabel),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    child: const Text('DESMARCAR'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onViewMore,
                    child: const Text('VER MAIS'),
                  ),
                ),
              ],
            ),
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
        Text(text, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
