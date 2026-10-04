import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../widgets/welcome_carousel.dart';
import '../auth/login_screen.dart';
import '../debug_login_test_screen.dart';

/// Mostrada quando não há sessão válida. Login/cadastro já rodam no
/// próprio app (ver lib/screens/auth); compra de plano continua só no
/// site, por isso o botão secundário.
class AccessBlockedScreen extends StatelessWidget {
  const AccessBlockedScreen({super.key, this.onDebugSessionEstablished});

  /// Chamado quando uma sessão é estabelecida (login real ou, em modo
  /// debug, o login de teste) — permite ao StartupGate reavaliar a sessão.
  final VoidCallback? onDebugSessionEstablished;

  void _openLogin(BuildContext context) {
    // Guarda o NavigatorState (não o context) na hora do clique: onLoggedIn
    // roda bem depois, e reavaliar Navigator.of(context) nesse momento
    // resolvia contra o context desta tela — que já podia ter sido
    // desativado (StartupGate troca AccessBlockedScreen assim que a sessão
    // é confirmada), causando "Looking up a deactivated widget's ancestor
    // is unsafe" (ou, sem os asserts de debug, "Null check operator used
    // on a null value"). Reproduzido em 2026-09-16: cadastro bem-sucedido
    // chama onLoggedIn() de dentro do RegisterScreen, empilhado por cima do
    // LoginScreen — um único .pop() só fechava o RegisterScreen e deixava
    // o Login "fantasma" na tela; tentar entrar de novo ali disparava o
    // crash. popUntil(isFirst) fecha as duas telas de uma vez, não só uma.
    final navigator = Navigator.of(context);
    navigator.push(
      MaterialPageRoute(
        builder: (_) => LoginScreen(onLoggedIn: () {
          navigator.popUntil((route) => route.isFirst);
          onDebugSessionEstablished?.call();
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WelcomeCarousel(
      lastLabel: 'Entrar na minha conta',
      onDone: () => _openLogin(context),
      onSkip: () => _openLogin(context),
      bottomLinkLabel: 'Já tenho conta · Entrar',
      onBottomLink: () => _openLogin(context),
      extra: kDebugMode
          ? TextButton(
              onPressed: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const DebugLoginTestScreen()),
                );
                onDebugSessionEstablished?.call();
              },
              child: const Text('[DEBUG] Testar login'),
            )
          : null,
    );
  }
}
