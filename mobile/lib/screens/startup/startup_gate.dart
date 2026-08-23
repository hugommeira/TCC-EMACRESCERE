import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../../services/onboarding_service.dart';
import '../onboarding/onboarding_screen.dart';
import '../shell/main_shell.dart';
import 'access_blocked_screen.dart';

enum _Stage { loading, blocked, onboarding, home }

/// Ponto de entrada do app: checa sessão, decide entre bloqueio,
/// onboarding (primeira vez) ou ir direto pra Home.
class StartupGate extends StatefulWidget {
  const StartupGate({super.key});

  @override
  State<StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<StartupGate> {
  _Stage _stage = _Stage.loading;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    setState(() => _stage = _Stage.loading);

    final session = await AuthService.checkSession();
    if (session == null) {
      setState(() => _stage = _Stage.blocked);
      return;
    }

    final seenOnboarding = await OnboardingService.hasSeenOnboarding();
    setState(() => _stage = seenOnboarding ? _Stage.home : _Stage.onboarding);
  }

  @override
  Widget build(BuildContext context) {
    switch (_stage) {
      case _Stage.loading:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case _Stage.blocked:
        return AccessBlockedScreen(onDebugSessionEstablished: _resolve);
      case _Stage.onboarding:
        return OnboardingScreen(onFinished: () => setState(() => _stage = _Stage.home));
      case _Stage.home:
        return const MainShell();
    }
  }
}
