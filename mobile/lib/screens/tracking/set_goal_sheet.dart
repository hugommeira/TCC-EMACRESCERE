import 'package:flutter/material.dart';

import '../../services/weight_service.dart';

/// Bottom sheet pra informar altura e meta de peso.
///
/// As duas coisas vivem no perfil do paciente, no servidor
/// (PATCH /api/patient/metrics) — a altura é o que destrava o cálculo do
/// IMC em todo o histórico.
class SetGoalSheet extends StatefulWidget {
  const SetGoalSheet({
    super.key,
    this.currentGoalKg,
    this.currentHeightCm,
    this.sugestaoKg,
  });

  final double? currentGoalKg;
  final double? currentHeightCm;

  /// Topo da faixa de peso normal para a altura — mostrado como sugestão.
  final double? sugestaoKg;

  static Future<bool?> show(
    BuildContext context, {
    double? currentGoalKg,
    double? currentHeightCm,
    double? sugestaoKg,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => SetGoalSheet(
        currentGoalKg: currentGoalKg,
        currentHeightCm: currentHeightCm,
        sugestaoKg: sugestaoKg,
      ),
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
  late final _heightController = TextEditingController(
    text: widget.currentHeightCm?.toStringAsFixed(0),
  );
  bool _saving = false;
  String? _erro;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _erro = null;
    });

    try {
      final alturaTexto = _heightController.text.trim();
      final metaTexto = _goalController.text.trim();
      await WeightService.updateMetrics(
        heightCm: alturaTexto.isEmpty
            ? null
            : double.parse(alturaTexto.replaceAll(',', '.')),
        goalWeightKg: metaTexto.isEmpty
            ? null
            : double.parse(metaTexto.replaceAll(',', '.')),
        // Campo esvaziado sobre uma meta que existia = apagar a meta.
        clearGoalWeight: metaTexto.isEmpty && widget.currentGoalKg != null,
      );
      if (mounted) Navigator.of(context).pop(true);
    } on WeightFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.message;
        _saving = false;
      });
    }
  }

  @override
  void dispose() {
    _goalController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sugestao = widget.sugestaoKg;

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
            Text('Altura e meta', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 20),
            TextFormField(
              controller: _heightController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Altura (cm)',
                hintText: 'Ex: 170',
                helperText: 'Usada para calcular o IMC de todo o histórico.',
              ),
              validator: (value) {
                final texto = (value ?? '').trim();
                if (texto.isEmpty) return null;
                final parsed = double.tryParse(texto.replaceAll(',', '.'));
                if (parsed == null || parsed < 100 || parsed > 250) {
                  return 'Informe uma altura válida em cm';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _goalController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Meta de peso (kg)',
                hintText: 'Ex: 70',
                helperText: sugestao == null
                    ? null
                    : 'Topo da faixa de peso normal: ${sugestao.toStringAsFixed(1)} kg',
              ),
              validator: (value) {
                final texto = (value ?? '').trim();
                if (texto.isEmpty) return null;
                final parsed = double.tryParse(texto.replaceAll(',', '.'));
                if (parsed == null || parsed < 20 || parsed > 400) {
                  return 'Informe um peso válido em kg';
                }
                return null;
              },
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
