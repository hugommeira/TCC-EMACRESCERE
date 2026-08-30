import 'package:flutter/material.dart';

import '../../services/weight_service.dart';

/// Bottom sheet pra definir (ou editar) a meta de peso.
class SetGoalSheet extends StatefulWidget {
  const SetGoalSheet({super.key, this.currentGoalKg});

  final double? currentGoalKg;

  static Future<bool?> show(BuildContext context, {double? currentGoalKg}) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => SetGoalSheet(currentGoalKg: currentGoalKg),
    );
  }

  @override
  State<SetGoalSheet> createState() => _SetGoalSheetState();
}

class _SetGoalSheetState extends State<SetGoalSheet> {
  final _formKey = GlobalKey<FormState>();
  late final _goalController = TextEditingController(
    text: widget.currentGoalKg?.toStringAsFixed(1),
  );
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    final goal = double.parse(_goalController.text.replaceAll(',', '.'));
    await WeightService.setGoalKg(goal);

    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  void dispose() {
    _goalController.dispose();
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
            Text('Meta de peso', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 20),
            TextFormField(
              controller: _goalController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Peso alvo (kg)',
                hintText: 'Ex: 70',
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
                child: Text(_saving ? 'Salvando...' : 'Salvar meta'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
