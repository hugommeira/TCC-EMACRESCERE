import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../services/api_client.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../queue/awaiting_payment_screen.dart';

/// Escolha da forma de pagamento de uma consulta agendada e geração da
/// cobrança (POST /api/checkout).
///
/// Espelha o CheckoutForm do site. Duas diferenças de propósito:
///   - cartão de crédito não é oferecido aqui (exige número, validade, CCV e
///     endereço do titular, que o app não coleta) — quem quiser paga no site;
///   - o valor não é enviado: o servidor calcula a partir do honorário do
///     médico e ignora o que vier no corpo.
///
/// Devolve `true` quando o pagamento foi confirmado, para a tela anterior
/// recarregar a lista.
class ConsultationPaymentScreen extends StatefulWidget {
  const ConsultationPaymentScreen({
    super.key,
    required this.consultationId,
    this.doctorName,
    this.scheduledAt,
    this.amount,
  });

  final String consultationId;
  final String? doctorName;
  final DateTime? scheduledAt;

  /// Só para exibir: o valor cobrado é decidido pelo servidor.
  final double? amount;

  static Future<bool?> show(
    BuildContext context, {
    required String consultationId,
    String? doctorName,
    DateTime? scheduledAt,
    double? amount,
  }) {
    return Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => ConsultationPaymentScreen(
          consultationId: consultationId,
          doctorName: doctorName,
          scheduledAt: scheduledAt,
          amount: amount,
        ),
      ),
    );
  }

  @override
  State<ConsultationPaymentScreen> createState() => _ConsultationPaymentScreenState();
}

class _ConsultationPaymentScreenState extends State<ConsultationPaymentScreen> {
  String _method = 'PIX';
  bool _generating = false;
  String? _erro;

  Future<void> _gerarCobranca() async {
    setState(() {
      _generating = true;
      _erro = null;
    });

    try {
      final payment = await ConsultationService.checkout(
        consultationId: widget.consultationId,
        method: _method,
      );
      if (!mounted) return;

      final pago = await Navigator.of(context).push<bool>(
        MaterialPageRoute<bool>(
          builder: (_) => AwaitingPaymentScreen(
            consultationId: widget.consultationId,
            payment: payment,
          ),
        ),
      );
      if (!mounted) return;
      if (pago == true) {
        Navigator.of(context).pop(true);
      } else {
        // Voltou sem pagar: deixa escolher outro método. O backend reaproveita
        // a cobrança em aberto, não gera duas.
        setState(() { _generating = false; });
      }
    } on ConsultationFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _generating = false;
        _erro = e.message;
      });
    }
  }

  Future<void> _pagarNoSite() async {
    final url = '${ApiClient.siteUrl}/dashboard/patient/consultations/${widget.consultationId}';
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final quando = widget.scheduledAt;

    return Scaffold(
      appBar: AppBar(title: const Text('Pagamento')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Falta pagar', style: textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              'A consulta já está marcada. O médico só pode iniciar o '
              'atendimento depois que o pagamento for confirmado.',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: 20),

            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (widget.doctorName != null)
                      Text(widget.doctorName!, style: textTheme.titleMedium),
                    if (quando != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        '${quando.day.toString().padLeft(2, '0')}/'
                        '${quando.month.toString().padLeft(2, '0')}/${quando.year} '
                        'às ${quando.hour.toString().padLeft(2, '0')}:'
                        '${quando.minute.toString().padLeft(2, '0')}',
                        style: textTheme.bodyMedium,
                      ),
                    ],
                    if (widget.amount != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        'R\$ ${widget.amount!.toStringAsFixed(2).replaceAll('.', ',')}',
                        style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text('valor confirmado pelo servidor', style: textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            Text('Como você quer pagar?', style: textTheme.titleSmall),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: _method,
              onChanged: (value) => setState(() { _method = value!; }),
              child: const Column(
                children: [
                  RadioListTile<String>(
                    contentPadding: EdgeInsets.zero,
                    title: Text('Pix'),
                    subtitle: Text('Confirmação em segundos'),
                    value: 'PIX',
                  ),
                  RadioListTile<String>(
                    contentPadding: EdgeInsets.zero,
                    title: Text('Boleto'),
                    subtitle: Text('Compensa em até 1 dia útil'),
                    value: 'BOLETO',
                  ),
                ],
              ),
            ),

            if (_erro != null) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.danger500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
                child: Text(_erro!, style: const TextStyle(color: AppColors.danger600)),
              ),
            ],

            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _generating ? null : _gerarCobranca,
                child: _generating
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Gerar cobrança'),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _pagarNoSite,
              child: const Text('Pagar com cartão no site'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Pagar depois'),
            ),
            const SizedBox(height: 8),
            Text(
              'A consulta fica como "aguardando pagamento" e pode ser paga '
              'a qualquer momento até a data marcada.',
              style: textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
