import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import '../../services/consultation_service.dart';
import '../../theme/app_theme.dart';

/// Pede confirmação e cancela a consulta. Devolve true se cancelou.
Future<bool> confirmAndCancelConsultation(
  BuildContext context,
  Consultation consultation,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Desmarcar consulta?'),
      content: const Text(
        'A consulta será cancelada. Se já houve pagamento, o reembolso é tratado pela clínica.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Manter'),
        ),
        TextButton(
          style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
          onPressed: () => Navigator.of(context).pop(true),
          child: const Text('Desmarcar'),
        ),
      ],
    ),
  );
  if (confirmed != true || !context.mounted) return false;

  try {
    await ConsultationService.cancelConsultation(consultation.id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Consulta desmarcada.')),
      );
    }
    return true;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Não foi possível desmarcar: $e')),
      );
    }
    return false;
  }
}
