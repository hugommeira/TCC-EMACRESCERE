import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../services/onboarding_service.dart';
import '../../widgets/welcome_carousel.dart';

/// Mostrada só na primeira vez que o login é bem-sucedido (flag persistida
/// via OnboardingService). Ao terminar, pede permissão de notificação.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onFinished});

  final VoidCallback onFinished;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  bool _finishing = false;

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);

    // Na web o pedido de notificação chama Notification.requestPermission(),
    // que não existe no Safari do iPhone fora da Tela de Início: o Future
    // falhava e o botão ficava girando para sempre. O app não manda
    // notificação na web, então nem pede; e uma falha aqui nunca prende a
    // entrada.
    if (!kIsWeb) {
      try {
        await Permission.notification.request();
      } catch (_) {}
    }
    try {
      await OnboardingService.markOnboardingSeen();
    } catch (_) {}

    if (mounted) widget.onFinished();
  }

  @override
  Widget build(BuildContext context) {
    return WelcomeCarousel(
      lastLabel: 'Começar',
      onDone: _finish,
      onSkip: _finish,
      busy: _finishing,
    );
  }
}
