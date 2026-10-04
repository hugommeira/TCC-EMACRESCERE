import 'dart:async';

import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

enum _StepState { idle, running, done, failed }

class _Step {
  _Step(this.label);
  final String label;
  _StepState state = _StepState.idle;
  String? detail;
}

/// Verificação do credenciamento no cadastro do médico — SIMULADA.
///
/// Mostra as etapas como se consultasse o conselho (CFM/CRM): o app não
/// integra API nenhuma; quem decide se o CRM "existe" é a regra simulada
/// do backend (services/external/cfm.ts do site), chamada dentro da etapa
/// 2 via POST /api/users/register. Devolve `null` em sucesso ou o
/// [RegisterFailure] pra tela de cadastro mostrar.
class CredentialCheckDialog extends StatefulWidget {
  const CredentialCheckDialog({
    super.key,
    required this.crm,
    required this.crmState,
    required this.submit,
  });

  final String crm;
  final String crmState;
  final Future<RegisterFailure?> Function() submit;

  static Future<RegisterFailure?> run(
    BuildContext context, {
    required String crm,
    required String crmState,
    required Future<RegisterFailure?> Function() submit,
  }) {
    return showDialog<RegisterFailure?>(
      context: context,
      barrierDismissible: false,
      builder: (_) => CredentialCheckDialog(crm: crm, crmState: crmState, submit: submit),
    ).then((value) => value);
  }

  @override
  State<CredentialCheckDialog> createState() => _CredentialCheckDialogState();
}

class _CredentialCheckDialogState extends State<CredentialCheckDialog> {
  late final List<_Step> _steps = [
    _Step('Validando CRM ${widget.crm}/${widget.crmState}'),
    _Step('Consultando registro no conselho'),
    _Step('Enviando cadastro para análise'),
  ];
  RegisterFailure? _failure;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    _run();
  }

  Future<void> _run() async {
    // Etapa 1: formato (o backend valida de novo).
    await _play(0, const Duration(milliseconds: 700));
    _done(0, 'Formato válido');

    // Etapa 2: o "conselho" — na prática, o cadastro no backend, que roda a
    // verificação simulada e recusa CRM inexistente/suspenso com 422.
    _start(1);
    final failure = await widget.submit();
    if (!mounted) return;
    if (failure != null) {
      setState(() {
        _steps[1].state = _StepState.failed;
        _steps[1].detail = failure.message;
        _failure = failure;
        _finished = true;
      });
      return;
    }
    _done(1, 'Registro ativo (verificação simulada)');

    await _play(2, const Duration(milliseconds: 600));
    _done(2, 'Aguardando aprovação da equipe Emacrescere');
    setState(() => _finished = true);

    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (mounted) Navigator.of(context).pop(null);
  }

  void _start(int i) => setState(() => _steps[i].state = _StepState.running);

  void _done(int i, String detail) => setState(() {
        _steps[i].state = _StepState.done;
        _steps[i].detail = detail;
      });

  Future<void> _play(int i, Duration d) async {
    _start(i);
    await Future<void>.delayed(d);
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return AlertDialog(
      title: const Text('Verificando credenciamento'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final step in _steps) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(width: 24, height: 24, child: _StepIcon(state: step.state)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step.label,
                        style: textTheme.bodyLarge?.copyWith(
                          color: step.state == _StepState.idle ? context.colors.gray400 : null,
                        ),
                      ),
                      if (step.detail != null)
                        Text(
                          step.detail!,
                          style: textTheme.bodySmall?.copyWith(
                            color: step.state == _StepState.failed ? context.colors.danger600 : null,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
          ],
          Text(
            'A consulta ao conselho é simulada nesta versão — não há integração com o CFM.',
            style: textTheme.bodySmall?.copyWith(color: context.colors.gray400),
          ),
        ],
      ),
      actions: [
        if (_failure != null)
          TextButton(
            onPressed: () => Navigator.of(context).pop(_failure),
            child: const Text('Corrigir dados'),
          ),
        if (_failure == null && _finished)
          TextButton(
            onPressed: () => Navigator.of(context).pop(null),
            child: const Text('Continuar'),
          ),
      ],
    );
  }
}

class _StepIcon extends StatelessWidget {
  const _StepIcon({required this.state});

  final _StepState state;

  @override
  Widget build(BuildContext context) {
    return switch (state) {
      _StepState.idle => Icon(Icons.radio_button_unchecked, size: 20, color: context.colors.gray300),
      _StepState.running => const Padding(
          padding: EdgeInsets.all(2),
          child: CircularProgressIndicator(strokeWidth: 2.5),
        ),
      _StepState.done => Icon(Icons.check_circle_rounded, size: 22, color: context.colors.brand600),
      _StepState.failed => Icon(Icons.cancel_rounded, size: 22, color: context.colors.danger600),
    };
  }
}
