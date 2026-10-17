import 'package:flutter/material.dart';

import '../services/api_error.dart';
import '../services/measures_service.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import 'ui.dart';

/// "Outras medidas" na aba Peso: cintura, quadril, gordura e massa magra, com
/// RCEst e RCQ como vêm do servidor. Sem metas, sem lembretes e sem
/// classificar os valores (a interpretação é com o médico, como no site).
class MeasuresCard extends StatefulWidget {
  const MeasuresCard({super.key});

  @override
  State<MeasuresCard> createState() => MeasuresCardState();
}

class MeasuresCardState extends State<MeasuresCard> {
  MeasuresHistory? _data;
  String? _error;
  String _type = kMeasures.first.type;

  MeasureDef get _def => kMeasures.firstWhere((m) => m.type == _type);

  @override
  void initState() {
    super.initState();
    reload();
  }

  /// Recarrega (a aba Peso chama ao voltar a aparecer).
  Future<void> reload() async {
    try {
      final data = await MeasuresService.getHistory();
      if (!mounted) return;
      setState(() {
        _data = data;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = errorMessage(e, fallback: 'Não foi possível carregar as medidas.'));
    }
  }

  Future<void> _add() async {
    final saved = await _AddMeasureSheet.show(context, _def);
    if (saved == true) await reload();
  }

  Future<void> _delete(MeasurePoint p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Apagar esta medida?'),
        content: Text('${_fmt(p.value)} ${_def.unit} em ${formatDate(p.measuredAt)}.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Apagar')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await MeasuresService.delete(p.id);
      await reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMessage(e))));
      }
    }
  }

  static String _fmt(double v) => formatDecimal(v).replaceAll(RegExp(r',0$'), '');

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final data = _data;
    final points = data?.series[_type] ?? const <MeasurePoint>[];
    final last = points.isEmpty ? null : points.last;
    final showRatios = data != null && (data.waistToHeight != null || data.waistToHip != null);

    return DsCard(
      radius: 26,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Outras medidas', style: AppType.title(20, ds.title)),
          const SizedBox(height: 4),
          Text(
            'Acompanhe outras medidas além do peso. Interprete os valores junto com o seu médico.',
            style: TextStyle(fontFamily: AppType.sans, fontSize: 13, height: 1.4, color: ds.muted),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: TextStyle(color: context.colors.danger600, fontSize: 13)),
          ],
          if (showRatios) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _Ratio(
                    label: 'Cintura ÷ altura (RCEst)',
                    value: data.waistToHeight,
                    empty: data.heightCm != null
                        ? 'Registre a cintura'
                        : 'Informe a altura no perfil',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _Ratio(
                    label: 'Cintura ÷ quadril (RCQ)',
                    value: data.waistToHip,
                    empty: 'Registre cintura e quadril',
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 14),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final m in kMeasures)
                ChoiceChip(
                  label: Text(m.label),
                  selected: m.type == _type,
                  onSelected: (_) => setState(() => _type = m.type),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            last == null
                ? 'Nenhuma medida de ${_def.label.toLowerCase()} registrada.'
                : 'Última: ${_fmt(last.value)} ${_def.unit} em ${formatDate(last.measuredAt)}',
            style: TextStyle(fontFamily: AppType.sans, fontSize: 14, color: ds.body),
          ),
          if (points.length > 1) ...[
            const SizedBox(height: 8),
            for (final p in points.reversed.skip(1).take(4))
              _PointRow(p: p, unit: _def.unit, onDelete: _delete),
          ],
          if (last != null && last.canDelete)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => _delete(last),
                icon: const Icon(Icons.delete_outline_rounded, size: 18),
                label: const Text('Apagar a última'),
              ),
            ),
          const SizedBox(height: 6),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _add,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: Text('Registrar ${_def.label.toLowerCase()}'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Ratio extends StatelessWidget {
  const _Ratio({required this.label, required this.value, required this.empty});

  final String label;
  final double? value;
  final String empty;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: ds.chip, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.muted),
          ),
          const SizedBox(height: 4),
          value != null
              ? Text(formatDecimal(value!, 2), style: AppType.title(22, ds.title))
              : Text(
                  empty,
                  style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.body),
                ),
        ],
      ),
    );
  }
}

class _PointRow extends StatelessWidget {
  const _PointRow({required this.p, required this.unit, required this.onDelete});

  final MeasurePoint p;
  final String unit;
  final ValueChanged<MeasurePoint> onDelete;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final who = (p.recordedBy ?? '').isNotEmpty ? ' · ${p.recordedBy}' : '';
    return InkWell(
      onLongPress: p.canDelete ? () => onDelete(p) : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Text(
          '${formatDate(p.measuredAt)}: ${MeasuresCardState._fmt(p.value)} $unit$who',
          style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
        ),
      ),
    );
  }
}

/// Registro de uma medida: valor e observação. Os limites são do servidor.
class _AddMeasureSheet extends StatefulWidget {
  const _AddMeasureSheet({required this.def});

  final MeasureDef def;

  static Future<bool?> show(BuildContext context, MeasureDef def) => showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (_) => _AddMeasureSheet(def: def),
  );

  @override
  State<_AddMeasureSheet> createState() => _AddMeasureSheetState();
}

class _AddMeasureSheetState extends State<_AddMeasureSheet> {
  final _value = TextEditingController();
  final _note = TextEditingController();
  bool _saving = false;
  String? _valueError;
  String? _error;

  Future<void> _save() async {
    final raw = _value.text.trim().replaceAll(',', '.');
    setState(() {
      _saving = true;
      _valueError = null;
      _error = null;
    });
    try {
      await MeasuresService.add(
        type: widget.def.type,
        value: double.tryParse(raw) ?? raw,
        note: _note.text.trim(),
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      final error = ApiError.from(e, fallback: 'Não foi possível salvar a medida.');
      setState(() {
        _saving = false;
        final fieldMsg = error.fieldErrors['value'];
        if (fieldMsg != null && fieldMsg.isNotEmpty) {
          _valueError = fieldMsg.first;
        } else {
          _error = error.firstFieldError ?? error.message;
        }
      });
    }
  }

  @override
  void dispose() {
    _value.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.def;
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Registrar ${d.label.toLowerCase()}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(d.hint, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 16),
            TextField(
              controller: _value,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: '${d.label} (${d.unit})',
                errorText: _valueError,
                errorMaxLines: 3,
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _note,
              decoration: const InputDecoration(labelText: 'Observação (opcional)'),
            ),
            if (_error != null) ...[
              Text(_error!, style: TextStyle(color: context.colors.danger600)),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Salvando...' : 'Salvar'),
            ),
          ],
        ),
      ),
    );
  }
}
