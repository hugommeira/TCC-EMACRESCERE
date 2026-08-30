import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../services/weight_service.dart';

/// Bottom sheet pra registrar um novo peso. Se a altura ainda não foi
/// informada (primeira vez), pede também — é necessária pro cálculo de IMC.
class RegisterWeightSheet extends StatefulWidget {
  const RegisterWeightSheet({super.key, required this.hasHeight});

  final bool hasHeight;

  static Future<bool?> show(BuildContext context, {required bool hasHeight}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => RegisterWeightSheet(hasHeight: hasHeight),
    );
  }

  @override
  State<RegisterWeightSheet> createState() => _RegisterWeightSheetState();
}

class _RegisterWeightSheetState extends State<RegisterWeightSheet> {
  final _formKey = GlobalKey<FormState>();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);

    final weight = double.parse(_weightController.text.replaceAll(',', '.'));

    if (!widget.hasHeight) {
      final height = double.parse(_heightController.text.replaceAll(',', '.'));
      await WeightService.setHeightCm(height);
    }

    await WeightService.addEntry(WeightEntry(date: DateTime.now(), weightKg: weight));

    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  void dispose() {
    _weightController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Registrar peso', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 20),
            if (!widget.hasHeight) ...[
              TextFormField(
                controller: _heightController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Altura (cm)',
                  hintText: 'Ex: 170',
                ),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                  if (parsed == null || parsed < 50 || parsed > 250) {
                    return 'Informe uma altura válida em cm';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
            ],
            TextFormField(
              controller: _weightController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Peso (kg)',
                hintText: 'Ex: 78.5',
              ),
              validator: (value) {
                final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                if (parsed == null || parsed <= 0 || parsed > 500) {
                  return 'Informe um peso válido em kg';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Salvando...' : 'Salvar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
