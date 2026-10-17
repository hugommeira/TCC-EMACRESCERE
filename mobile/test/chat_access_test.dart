import 'package:emacrescere_app/errors/error_catalog.dart';
import 'package:emacrescere_app/services/chat_service.dart';
import 'package:flutter_test/flutter_test.dart';

/// `access` do GET do chat: o app só lê o que o servidor decidiu.
void main() {
  test('janela de 24 h: pode mandar e traz o prazo', () {
    final a = ChatAccess.fromJson({
      'canSend': true,
      'sendUntil': '2026-10-16T17:00:00.000Z',
      'reason': 'POS_CONSULTA',
    })!;
    expect(a.canSend, isTrue);
    expect(a.sendUntil, DateTime.utc(2026, 10, 16, 17));
  });

  test('fechado: cada motivo vira o código do catálogo do servidor', () {
    String codeFor(String reason) =>
        ChatAccess.fromJson({'canSend': false, 'sendUntil': null, 'reason': reason})!.blockedCode;
    expect(codeFor('ENCERRADO'), 'CHAT_ENCERRADO');
    expect(codeFor('CANCELADA'), 'CONSULTA_ENCERRADA');
    expect(codeFor('NAO_INICIADA'), 'CHAT_FORA_DA_CONSULTA');
    for (final code in ['CHAT_ENCERRADO', 'CONSULTA_ENCERRADA', 'CHAT_FORA_DA_CONSULTA']) {
      expect(kErrorMessages.containsKey(code), isTrue, reason: code);
    }
  });

  test('servidor sem access: nulo, e o app só reage ao erro do envio', () {
    expect(ChatAccess.fromJson(null), isNull);
  });
}
