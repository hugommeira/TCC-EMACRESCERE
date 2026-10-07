import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:emacrescere_app/widgets/video_call_panel.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Faixa da videochamada fechada (antes de entrar): cabe a 320px nos dois
/// temas e não liga câmera nem rede sozinha.
void main() {
  for (final dark in [false, true]) {
    testWidgets('faixa do vídeo renderiza a 320px no tema ${dark ? 'escuro' : 'claro'}', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 800);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: dark ? ThemeMode.dark : ThemeMode.light,
          home: const Scaffold(
            body: Column(
              children: [VideoCallPanel(consultationId: 'c1', otherLabel: 'o médico')],
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.text('Entrar no vídeo'), findsOneWidget);
      expect(find.text('Videochamada da consulta'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}
