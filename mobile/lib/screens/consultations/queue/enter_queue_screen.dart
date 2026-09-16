import 'package:flutter/material.dart';

import '../../../services/queue_service.dart';
import '../../../theme/app_theme.dart';
import 'awaiting_payment_screen.dart';

/// Entrada na fila on-demand (POST /api/queue/enter): motivo + forma de
/// pagamento. O backend cria a consulta e a cobrança no Asaas no mesmo
/// request e devolve o Pix/boleto, que a próxima tela mostra.
///
/// Cartão de crédito exige número, validade, CVV e endereço do titular no
/// mesmo request — fica pra depois; hoje só Pix e boleto.
///
/// Devolve `true` pelo Navigator quando a consulta foi criada (mesmo que
/// o pagamento ainda esteja pendente), pra quem chamou recarregar a lista.
class EnterQueueScreen extends StatefulWidget {
  const EnterQueueScreen({super.key});

  @override
  State<EnterQueueScreen> createState() => _EnterQueueScreenState();
}

class _EnterQueueScreenState extends State<EnterQueueScreen> {
  final _complaintController = TextEditingController();
  String _method = 'PIX';
  bool _submitting = false;
  String? _error;

  static const _methods = {
    'PIX': ('Pix', 'Confirmação em segundos'),
    'BOLETO': ('Boleto', 'Compensa em até 1 dia útil'),
  };

  @override
  void dispose() {
    _complaintController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final complaint = _complaintController.text.trim();
    if (complaint.length < 3) {
      setState(() => _error = 'Descreva o motivo da consulta (mínimo 3 caracteres).');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final entry = await QueueService.enter(chiefComplaint: complaint, method: _method);
      if (!mounted) return;
      // Troca esta tela pela de pagamento; ao voltar de lá, cai direto na
      // aba Consultas (com resultado true pra recarregar).
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AwaitingPaymentScreen(
            consultationId: entry.consultationId,
            payment: entry.payment,
          ),
        ),
        result: true,
      );
    } on QueueFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.statusCode == 409
            ? 'Você já tem uma consulta em aberto (agendada, na fila ou em atendimento). '
                'Finalize ou desmarque antes de entrar na fila.'
            : e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = 'Não foi possível entrar na fila: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Nova consulta')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.bolt_outlined, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Você entra na fila assim que o pagamento for confirmado e o '
                        'primeiro médico disponível te atende.',
                        style: textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (_error != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.danger500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
                child: Text(_error!, style: const TextStyle(color: AppColors.danger600)),
              ),
              const SizedBox(height: 16),
            ],
            TextField(
              controller: _complaintController,
              maxLines: 5,
              maxLength: 500,
              enabled: !_submitting,
              decoration: const InputDecoration(
                labelText: 'O que você está sentindo?',
                hintText: 'Ex: Dúvida sobre a medicação, enjoo nos últimos dias, ajuste da dieta...',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            Text('Forma de pagamento', style: textTheme.titleSmall),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: _method,
              onChanged: (value) {
                if (!_submitting && value != null) setState(() => _method = value);
              },
              child: Column(
                children: [
                  for (final entry in _methods.entries)
                    RadioListTile<String>(
                      contentPadding: EdgeInsets.zero,
                      title: Text(entry.value.$1),
                      subtitle: Text(entry.value.$2, style: textTheme.bodySmall),
                      value: entry.key,
                    ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    enabled: false,
                    leading: const Padding(
                      padding: EdgeInsets.only(left: 12),
                      child: Icon(Icons.credit_card_outlined, color: AppColors.gray400),
                    ),
                    title: const Text('Cartão de crédito'),
                    subtitle: Text('Em breve', style: textTheme.bodySmall),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Continuar pro pagamento'),
            ),
          ],
        ),
      ),
    );
  }
}
