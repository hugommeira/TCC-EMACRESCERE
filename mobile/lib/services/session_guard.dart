import 'package:flutter/material.dart';

import '../errors/error_catalog.dart';

/// Reação global à sessão expirada (AUTH_SESSAO_EXPIRADA).
///
/// O interceptor do ApiClient chama [onSessionExpired] quando qualquer
/// chamada recebe 401. Antes o app só olhava a sessão ao abrir: com ela
/// vencida no meio do uso, cada tela mostrava um erro diferente (ou travava
/// carregando).
class SessionGuard {
  SessionGuard._();

  static final navigatorKey = GlobalKey<NavigatorState>();
  static final messengerKey = GlobalKey<ScaffoldMessengerState>();

  /// Monta a tela inicial (StartupGate). Definido em main.dart para não criar
  /// import circular entre serviços e telas.
  static Widget Function()? homeBuilder;

  static bool _handling = false;

  static void onSessionExpired() {
    if (_handling) return; // várias chamadas podem falhar juntas
    final nav = navigatorKey.currentState;
    final builder = homeBuilder;
    if (nav == null || builder == null) return;
    _handling = true;
    nav.pushAndRemoveUntil(MaterialPageRoute<void>(builder: (_) => builder()), (_) => false);
    messengerKey.currentState?.showSnackBar(
      SnackBar(content: Text(messageForCode('AUTH_SESSAO_EXPIRADA'))),
    );
    // Libera de novo depois que a tela inicial assumiu.
    Future<void>.delayed(const Duration(seconds: 2), () => _handling = false);
  }
}
