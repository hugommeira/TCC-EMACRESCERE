import 'package:flutter/material.dart';

import '../../models/doctor_profile.dart';
import '../../services/auth_service.dart';
import '../../services/doctor_service.dart';
import '../../services/onboarding_service.dart';
import '../../theme/theme_controller.dart';
import '../doctor/doctor_pending_screen.dart';
import '../doctor/doctor_shell.dart';
import '../onboarding/onboarding_screen.dart';
import '../shell/main_shell.dart';
import 'access_blocked_screen.dart';

enum _Stage { loading, blocked, onboarding, home, doctorPending, doctorHome }

/// Ponto de entrada do app: checa sessão e manda cada perfil pro lugar
/// certo — paciente (onboarding na 1ª vez, depois Home), médico
/// credenciado (shell do médico) ou médico ainda em análise/reprovado
/// (tela de espera).
class StartupGate extends StatefulWidget {
  const StartupGate({super.key});

  @override
  State<StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<StartupGate> {
  _Stage _stage = _Stage.loading;
  DoctorProfile? _doctorProfile;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    setState(() => _stage = _Stage.loading);

    final session = await AuthService.checkSession();
    if (session == null) {
      // Telas de entrada seguem o tema da paciente.
      ThemeController.instance.setAudience(ThemeAudience.patient);
      setState(() => _stage = _Stage.blocked);
      return;
    }

    // Paciente e médico têm tema próprio (o médico começa no escuro).
    ThemeController.instance.setAudience(
      session.role == 'DOCTOR' ? ThemeAudience.doctor : ThemeAudience.patient,
    );

    if (session.role == 'DOCTOR') {
      try {
        final profile = await DoctorService.getProfile();
        if (!mounted) return;
        setState(() {
          _doctorProfile = profile;
          _stage = profile.isApproved ? _Stage.doctorHome : _Stage.doctorPending;
        });
      } catch (_) {
        // Sem perfil (conta antiga sem DoctorProfile) ou sem rede: trata
        // como pendente, que é a tela mais segura e tem "tentar de novo".
        if (mounted) setState(() => _stage = _Stage.doctorPending);
      }
      return;
    }

    final seenOnboarding = await OnboardingService.hasSeenOnboarding();
    if (!mounted) return;
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
      case _Stage.doctorPending:
        return DoctorPendingScreen(profile: _doctorProfile, onRetry: _resolve);
      case _Stage.doctorHome:
        return const DoctorShell();
    }
  }
}
