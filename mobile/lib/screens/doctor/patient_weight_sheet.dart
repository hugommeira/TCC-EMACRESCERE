import 'package:flutter/material.dart';

import '../../models/weight_entry.dart';
import '../../services/weight_service.dart';
import '../../theme/app_theme.dart';
import '../tracking/weight_chart.dart';

/// Evolução de peso do paciente, do lado do médico, dentro da consulta.
///
/// Só abre para o médico que atende esse paciente — quem valida é o
/// backend (services/api/weight.ts devolve 403 sem vínculo).
class PatientWeightSheet extends StatefulWidget {
  const PatientWeightSheet({
    super.key,
    required this.patientId,
    required this.patientName,
    required this.consultationId,
  });

  final String patientId;
  final String patientName;
  final String consultationId;

  static Future<bool?> show(
    BuildContext context, {
    required String patientId,
    required String patientName,
    required String consultationId,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => PatientWeightSheet(
        patientId: patientId,
        patientName: patientName,
        consultationId: consultationId,
      ),
    );
  }

  @override
  State<PatientWeightSheet> createState() => _PatientWeightSheetState();
}

class _PatientWeightSheetState extends State<PatientWeightSheet> {
  WeightHistory? _history;
  bool _loading = true;
  String? _erro;
  WeightRange _range = WeightRange.d180;
  bool _registrou = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    // Guardado porque _load é chamado também depois de um await (ao registrar
    // o peso aferido): se o médico fechar a folha nesse meio, setState num
    // State já desmontado estoura.
    if (!mounted) return;
    setState(() {
      _loading = true;
      _erro = null;
    });
    try {
      final h = await WeightService.getHistory(patientId: widget.patientId);
      if (!mounted) return;
      setState(() {
        _history = h;
        _loading = false;
      });
    } on WeightFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.message;
        _loading = false;
      });
    }
  }

  List<WeightEntry> get _doPeriodo {
    final todas = _history?.entries ?? const <WeightEntry>[];
    final dias = _range.days;
    if (dias == null) return todas;
    final corte = DateTime.now().subtract(Duration(days: dias));
    return todas.where((e) => e.date.isAfter(corte)).toList();
  }

  Future<void> _registrarAferido() async {
    final controller = TextEditingController();
    double? peso;
    try {
      peso = await showDialog<double>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Peso aferido'),
          content: TextField(
            controller: controller,
            autofocus: true,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Peso (kg)', hintText: 'Ex: 82,4'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancelar')),
            FilledButton(
              onPressed: () {
                final v = double.tryParse(controller.text.replaceAll(',', '.'));
                Navigator.of(ctx).pop(v);
              },
              child: const Text('Salvar'),
            ),
          ],
        ),
      );
    } finally {
      controller.dispose();
    }

    // Mesmos limites do backend (WEIGHT_MIN_KG/WEIGHT_MAX_KG em lib/bmi.ts):
    // 82 digitado como 820 não vira dado.
    if (peso == null || peso < 20 || peso > 400) return;

    try {
      await WeightService.addEntry(
        weightKg: peso,
        patientId: widget.patientId,
        consultationId: widget.consultationId,
      );
      _registrou = true;
      await _load();
    } on WeightFailure catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final entries = _doPeriodo;
    final ultimo = _history?.latest;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Evolução de peso', style: Theme.of(context).textTheme.titleLarge),
              ),
              IconButton(
                tooltip: 'Fechar',
                onPressed: () => Navigator.of(context).pop(_registrou),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          Text(widget.patientName, style: const TextStyle(color: AppColors.gray600)),
          const SizedBox(height: 16),

          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_erro != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                children: [
                  Text(_erro!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: _load, child: const Text('Tentar de novo')),
                ],
              ),
            )
          else ...[
            if (ultimo != null)
              Row(
                children: [
                  _Numero(
                    rotulo: 'Peso atual',
                    valor: '${ultimo.weightKg.toStringAsFixed(1)} kg',
                  ),
                  const SizedBox(width: 24),
                  _Numero(
                    rotulo: 'IMC',
                    valor: ultimo.bmi != null ? ultimo.bmi!.toStringAsFixed(1) : '—',
                    detalhe: ultimo.bmiLabel,
                  ),
                  if (_history?.summary.deltaKg != null) ...[
                    const SizedBox(width: 24),
                    _Numero(
                      rotulo: 'Desde o início',
                      valor: _comSinal(_history!.summary.deltaKg!),
                    ),
                  ],
                ],
              ),
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final r in WeightRange.values)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(r.label),
                        selected: _range == r,
                        onSelected: (_) => setState(() { _range = r; }),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 200,
              child: WeightChart(
                entries: entries,
                goalKg: _history?.summary.goalWeightKg,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _registrarAferido,
                icon: const Icon(Icons.add_circle_outline, size: 18),
                label: const Text('Registrar peso aferido'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

String _comSinal(double v) {
  final sinal = v > 0 ? '+' : v < 0 ? '−' : '';
  return '$sinal${v.abs().toStringAsFixed(1)} kg';
}

class _Numero extends StatelessWidget {
  const _Numero({required this.rotulo, required this.valor, this.detalhe});

  final String rotulo;
  final String valor;
  final String? detalhe;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(rotulo, style: Theme.of(context).textTheme.labelMedium),
        const SizedBox(height: 2),
        Text(valor, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        if (detalhe != null)
          Text(detalhe!, style: const TextStyle(fontSize: 11, color: AppColors.gray600)),
      ],
    );
  }
}
