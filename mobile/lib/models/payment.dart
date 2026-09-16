/// Cobrança de uma consulta (Asaas via backend). Vem embutida em
/// Consultation (campo `payment`) e na resposta de POST /api/queue/enter.
class PaymentInfo {
  const PaymentInfo({
    required this.id,
    required this.status,
    required this.method,
    required this.amount,
    this.pixQrCode,
    this.pixCopyPaste,
    this.boletoUrl,
  });

  final String id;

  /// PENDING | CONFIRMED | RECEIVED | OVERDUE | REFUNDED | CANCELLED
  final String status;

  /// PIX | BOLETO | CREDIT_CARD
  final String method;
  final double amount;

  /// PNG em base64 (sem prefixo data:).
  final String? pixQrCode;
  final String? pixCopyPaste;
  final String? boletoUrl;

  bool get isPending => status == 'PENDING' || status == 'OVERDUE';
  bool get isPaid => status == 'CONFIRMED' || status == 'RECEIVED';

  factory PaymentInfo.fromJson(Map<String, dynamic> json) => PaymentInfo(
        id: json['id'] as String,
        status: json['status'] as String,
        method: json['method'] as String? ?? 'PIX',
        amount: double.tryParse(json['amount'].toString()) ?? 0,
        pixQrCode: json['pixQrCode'] as String?,
        pixCopyPaste: json['pixCopyPaste'] as String?,
        boletoUrl: json['boletoUrl'] as String?,
      );
}
