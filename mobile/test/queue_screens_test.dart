import 'dart:convert';

import 'package:emacrescere_app/models/payment.dart';
import 'package:emacrescere_app/screens/consultations/queue/awaiting_payment_screen.dart';
import 'package:emacrescere_app/screens/consultations/queue/queue_waiting_screen.dart';
import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// PNG 1x1 transparente — suficiente pra Image.memory decodificar.
final _tinyPng = base64Encode([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
  0x89, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x02, 0x00,
  0x00, 0x05, 0x00, 0x01, 0xE2, 0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
  0xAE, 0x42, 0x60, 0x82,
]);

Widget _wrap(Widget child) => MaterialApp(theme: AppTheme.light, home: child);

/// Telas de fila/pagamento renderizam sem overflow em largura de celular
/// (320px). Altura exagerada de propósito: ListView só constrói o que
/// cabe no viewport e a fonte de teste (Ahem) é bem mais larga que a real.
/// Chamadas de rede (polling) falham silenciosamente aqui — o que se testa
/// é o layout, não a integração.
void main() {
  setUp(() {
    TestWidgetsFlutterBinding.ensureInitialized();
  });

  testWidgets('AwaitingPaymentScreen mostra Pix com QR e copia-e-cola', (tester) async {
    tester.view.physicalSize = const Size(320, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_wrap(AwaitingPaymentScreen(
      consultationId: 'c1',
      payment: PaymentInfo(
        id: 'p1',
        status: 'PENDING',
        method: 'PIX',
        amount: 150,
        pixQrCode: _tinyPng,
        pixCopyPaste: '00020101021226MOCK...',
      ),
    )));
    await tester.pump();

    expect(find.text('R\$ 150,00'), findsOneWidget);
    expect(find.text('Copiar código Pix'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
    expect(find.text('Aguardando confirmação…'), findsOneWidget);
    expect(tester.takeException(), isNull);

    // Descarta a tela pra cancelar o timer de polling.
    await tester.pumpWidget(_wrap(const SizedBox()));
  });

  testWidgets('AwaitingPaymentScreen mostra boleto', (tester) async {
    tester.view.physicalSize = const Size(320, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_wrap(const AwaitingPaymentScreen(
      consultationId: 'c1',
      payment: PaymentInfo(
        id: 'p1',
        status: 'PENDING',
        method: 'BOLETO',
        amount: 150,
        boletoUrl: 'https://example.com/boleto',
      ),
    )));
    await tester.pump();

    expect(find.text('Abrir boleto'), findsOneWidget);
    expect(find.byType(Image), findsNothing);
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(_wrap(const SizedBox()));
  });

  testWidgets('QueueWaitingScreen renderiza estado inicial', (tester) async {
    tester.view.physicalSize = const Size(320, 1400);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(_wrap(const QueueWaitingScreen(consultationId: 'c1')));
    await tester.pump();

    expect(find.text('Você está na fila'), findsOneWidget);
    expect(find.text('Sair da fila'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(_wrap(const SizedBox()));
  });
}
