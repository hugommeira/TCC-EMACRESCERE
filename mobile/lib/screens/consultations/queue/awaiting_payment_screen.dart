import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/consultation.dart';
import '../../../models/payment.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';

/// Cobrança gerada: QR Pix / copia-e-cola / boleto vindos do backend
/// (Asaas), e espera pela confirmação.
///
/// Faz polling de GET /api/consultations/:id olhando o `payment.status`.
/// Antes olhava GET /api/queue/position esperando o status WAITING — isso
/// só acontecia no fluxo da fila: consulta AGENDADA e paga continua
/// SCHEDULED, então a tela nunca percebia a confirmação e o paciente
/// ficava preso em "Aguardando". O site documenta o mesmo tropeço em
/// components/patient/ScheduledConsultationWatcher.tsx.
///
/// Devolve `true` quando o pagamento é confirmado.
///
/// O botão "Simular pagamento" só funciona se o servidor estiver com
/// PAYMENT_MOCK=true; aqui ele aparece só em build de debug.
class AwaitingPaymentScreen extends StatefulWidget {
  const AwaitingPaymentScreen({
    super.key,
    required this.consultationId,
    required this.payment,
  });

  final String consultationId;
  final PaymentInfo payment;

  @override
  State<AwaitingPaymentScreen> createState() => _AwaitingPaymentScreenState();
}

class _AwaitingPaymentScreenState extends State<AwaitingPaymentScreen> {
  Timer? _poll;
  bool _simulating = false;
  bool _cancelling = false;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _checkStatus());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _checkStatus() async {
    try {
      final c = await ConsultationService.getConsultationDetail(widget.consultationId);
      if (!mounted) return;

      // O que importa é a cobrança: a consulta agendada continua SCHEDULED
      // mesmo depois de paga.
      if (c.payment?.isPaid ?? false) {
        _poll?.cancel();
        Navigator.of(context).pop(true);
        return;
      }

      // O médico já iniciou (fluxo antigo da fila, ou pagamento confirmado
      // por outro caminho).
      if (c.status == ConsultationStatus.inProgress) {
        _poll?.cancel();
        Navigator.of(context).pop(true);
        return;
      }

      if (c.status == ConsultationStatus.cancelled ||
          c.status == ConsultationStatus.completed ||
          c.status == ConsultationStatus.noShow) {
        _poll?.cancel();
        setState(() => _notice = 'Esta consulta foi encerrada (${c.status.label}).');
      }
    } catch (_) {
      // Falha momentânea de rede: o próximo tick tenta de novo.
    }
  }

  Future<void> _copyPix() async {
    final code = widget.payment.pixCopyPaste;
    if (code == null) return;
    await Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Código Pix copiado.')),
    );
  }

  Future<void> _openBoleto() async {
    final url = widget.payment.boletoUrl;
    if (url == null) return;
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  Future<void> _simulate() async {
    setState(() {
      _simulating = true;
      _notice = null;
    });
    try {
      await ConsultationService.simulatePayment(widget.consultationId);
      await _checkStatus();
    } on ConsultationFailure catch (e) {
      if (mounted) setState(() => _notice = e.message);
    } finally {
      if (mounted) setState(() => _simulating = false);
    }
  }

  Future<void> _giveUp() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Desistir da consulta?'),
        content: const Text('A consulta será cancelada e a cobrança não deve ser paga.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Voltar'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Desistir'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _cancelling = true);
    try {
      await ConsultationService.cancelConsultation(widget.consultationId);
      if (mounted) Navigator.of(context).pop(false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _cancelling = false;
        _notice = 'Não foi possível cancelar: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final payment = widget.payment;
    final textTheme = Theme.of(context).textTheme;
    final amount = 'R\$ ${payment.amount.toStringAsFixed(2).replaceAll('.', ',')}';

    return Scaffold(
      appBar: AppBar(title: const Text('Pagamento')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Confirme seu pagamento', style: textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              'Assim que o pagamento for confirmado a consulta fica garantida e o médico pode iniciar o atendimento.',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text('Consulta', style: textTheme.bodyMedium)),
                        const SizedBox(width: 8),
                        Text(amount, style: textTheme.titleMedium),
                      ],
                    ),
                    if (payment.method == 'PIX') ...[
                      const SizedBox(height: 16),
                      _PixQr(base64Png: payment.pixQrCode),
                      if (payment.pixCopyPaste != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.gray100,
                            borderRadius: BorderRadius.circular(AppRadius.card),
                          ),
                          child: Text(
                            payment.pixCopyPaste!,
                            style: textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          onPressed: _copyPix,
                          icon: const Icon(Icons.copy, size: 18),
                          label: const Text('Copiar código Pix'),
                        ),
                      ],
                    ],
                    if (payment.method == 'BOLETO') ...[
                      const SizedBox(height: 16),
                      Text(
                        'O boleto compensa em até 1 dia útil. Você pode fechar o app e voltar depois — a consulta fica em "Aguardando pagamento".',
                        style: textTheme.bodySmall,
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: payment.boletoUrl != null ? _openBoleto : null,
                        icon: const Icon(Icons.receipt_long_outlined, size: 18),
                        label: const Text('Abrir boleto'),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 10),
                Flexible(child: Text('Aguardando confirmação…', style: textTheme.bodyMedium)),
              ],
            ),
            if (_notice != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.danger500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadius.card),
                ),
                child: Text(_notice!, style: const TextStyle(color: AppColors.danger600)),
              ),
            ],
            if (kDebugMode) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warning500.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.warning500),
                  borderRadius: BorderRadius.circular(AppRadius.cardLarge),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('MODO TESTE', style: textTheme.labelMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Só funciona se o servidor estiver com PAYMENT_MOCK=true.',
                      style: textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _simulating ? null : _simulate,
                      child: Text(_simulating ? 'Confirmando…' : 'Simular pagamento confirmado'),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            TextButton(
              onPressed: _cancelling ? null : _giveUp,
              style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
              child: Text(_cancelling ? 'Cancelando…' : 'Desistir da consulta'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PixQr extends StatelessWidget {
  const _PixQr({required this.base64Png});

  final String? base64Png;

  @override
  Widget build(BuildContext context) {
    final raw = base64Png;
    Uint8List? bytes;
    if (raw != null && raw.isNotEmpty) {
      try {
        bytes = base64Decode(raw.replaceFirst(RegExp(r'^data:image/\w+;base64,'), ''));
      } catch (_) {
        bytes = null;
      }
    }

    return Center(
      child: Container(
        width: 220,
        height: 220,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.gray200),
          borderRadius: BorderRadius.circular(AppRadius.card),
        ),
        child: bytes != null
            ? Image.memory(bytes, fit: BoxFit.contain, gaplessPlayback: true)
            : const Center(
                child: Text(
                  'QR code indisponível — use o código copia-e-cola.',
                  textAlign: TextAlign.center,
                ),
              ),
      ),
    );
  }
}
