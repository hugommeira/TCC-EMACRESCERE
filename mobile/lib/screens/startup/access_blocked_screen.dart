import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/app_theme.dart';
import '../../widgets/brand_mark.dart';
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

  static const _siteUrl = 'https://tcc-emacrescere.vercel.app';

  Future<void> _openSite() async {
    final uri = Uri.parse(_siteUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

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
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLockup(
                tileSize: 96,
                tagline: 'Seu acompanhamento de emagrecimento,\nsempre com você.',
              ),
              const SizedBox(height: 36),
              _FeatureRow(icon: Icons.chat_bubble_outline_rounded, text: 'Fale com o médico por chat'),
              _FeatureRow(icon: Icons.monitor_weight_outlined, text: 'Acompanhe peso e IMC'),
              _FeatureRow(icon: Icons.description_outlined, text: 'Receitas assinadas digitalmente'),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: () => _openLogin(context),
                child: const Text('Entrar'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
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

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: AppColors.brandGradientSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 18, color: AppColors.brand700),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyLarge)),
        ],
      ),
    );
  }
}
