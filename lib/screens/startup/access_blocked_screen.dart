import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../debug_login_test_screen.dart';

/// Mostrada quando não há sessão válida. O app não tem cadastro/compra de
/// plano — isso só existe no site — então o CTA manda o usuário pra lá.
class AccessBlockedScreen extends StatelessWidget {
  const AccessBlockedScreen({super.key, this.onDebugSessionEstablished});

  /// Chamado quando, em modo debug, um login de teste é concluído com
  /// sucesso — permite ao StartupGate reavaliar a sessão.
  final VoidCallback? onDebugSessionEstablished;

  static const _siteUrl = 'https://tcc-emacrescere.vercel.app';

  Future<void> _openSite() async {
    final uri = Uri.parse(_siteUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.lock_outline,
                size: 72,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 24),
              Text(
                'Acesso bloqueado',
                style: Theme.of(context).textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'Você precisa de uma conta ativa com plano de acompanhamento '
                'pra usar o app. Cadastro e compra de plano são feitos no '
                'nosso site.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _openSite,
                child: const Text('Acessar o site'),
              ),
              if (kDebugMode) ...[
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const DebugLoginTestScreen(),
                      ),
                    );
                    onDebugSessionEstablished?.call();
                  },
                  child: const Text('[DEBUG] Testar login'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
