import 'package:flutter/material.dart';

import '../../services/weight_service.dart';

/// Bottom sheet pra registrar uma pesagem. Se a altura ainda não foi
/// informada (primeira vez), pede também — é ela que destrava o IMC.
///
/// Grava no servidor (POST /api/weight), não mais só no aparelho.
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
  DateTime _date = DateTime.now();
  bool _saving = false;
  String? _erro;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _erro = null;
    });

    try {
      if (!widget.hasHeight) {
        final height = double.parse(_heightController.text.replaceAll(',', '.'));
        await WeightService.updateMetrics(heightCm: height);
      }

      final weight = double.parse(_weightController.text.replaceAll(',', '.'));
      await WeightService.addEntry(weightKg: weight, measuredAt: _date);

      if (mounted) Navigator.of(context).pop(true);
    } on WeightFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.message;
        _saving = false;
      });
    }
  }

  Future<void> _pickDate() async {
    final hoje = DateTime.now();
    final escolhida = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(hoje.year - 3),
      lastDate: hoje,
    );
    if (escolhida != null) setState(() { _date = escolhida; });
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
                  helperText: 'Usada para calcular o IMC de todo o histórico.',
                ),
                validator: (value) {
                  final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                  if (parsed == null || parsed < 100 || parsed > 250) {
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
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Peso (kg)',
                hintText: 'Ex: 78,5',
              ),
              validator: (value) {
                final parsed = double.tryParse((value ?? '').replaceAll(',', '.'));
                if (parsed == null || parsed < 20 || parsed > 400) {
                  return 'Informe um peso válido em kg';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _pickDate,
              borderRadius: BorderRadius.circular(14),
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Data da pesagem'),
                child: Text(
                  '${_date.day.toString().padLeft(2, '0')}/'
                  '${_date.month.toString().padLeft(2, '0')}/${_date.year}',
                ),
              ),
            ),
            if (_erro != null) ...[
              const SizedBox(height: 12),
              Text(_erro!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
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
