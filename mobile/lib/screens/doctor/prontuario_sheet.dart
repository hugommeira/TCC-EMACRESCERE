import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import '../../services/doctor_service.dart';
import '../../theme/app_theme.dart';

/// Prontuário da consulta (diagnóstico, conduta, observações) — PATCH
/// /api/consultations/[id]/prontuario. Devolve true se salvou.
class ProntuarioSheet extends StatefulWidget {
  const ProntuarioSheet({super.key, required this.consultation});

  final Consultation consultation;

  static Future<bool?> show(BuildContext context, Consultation consultation) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ProntuarioSheet(consultation: consultation),
    );
  }

  @override
  State<ProntuarioSheet> createState() => _ProntuarioSheetState();
}

class _ProntuarioSheetState extends State<ProntuarioSheet> {
  late final _diagnosis = TextEditingController(text: widget.consultation.diagnosis ?? '');
  late final _conduct = TextEditingController(text: widget.consultation.conduct ?? '');
  final _notes = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _diagnosis.dispose();
    _conduct.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await DoctorService.updateProntuario(
        widget.consultation.id,
        diagnosis: _diagnosis.text.trim(),
        conduct: _conduct.text.trim(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(true);
    } on DoctorFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottom),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Prontuário', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              'Paciente: ${widget.consultation.patient?.name ?? '—'}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.colors.danger500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
                child: Text(_error!, style: TextStyle(color: context.colors.danger600)),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: _diagnosis,
              maxLines: 3,
              maxLength: 2000,
              decoration: const InputDecoration(labelText: 'Diagnóstico / hipótese', alignLabelWithHint: true),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _conduct,
              maxLines: 4,
              maxLength: 4000,
              decoration: const InputDecoration(labelText: 'Conduta / orientações', alignLabelWithHint: true),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notes,
              maxLines: 2,
              maxLength: 4000,
              decoration: const InputDecoration(labelText: 'Observações internas (opcional)', alignLabelWithHint: true),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Salvando…' : 'Salvar prontuário'),
            ),
          ],
        ),
      ),
    );
  }
}
