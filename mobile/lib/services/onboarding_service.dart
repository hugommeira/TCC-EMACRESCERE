import 'package:shared_preferences/shared_preferences.dart';

/// Persiste se o usuário já viu o onboarding, pra mostrar só na primeira
/// vez que o login é bem-sucedido.
class OnboardingService {
  OnboardingService._();

  static const _seenKey = 'onboarding_seen';

  static Future<bool> hasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_seenKey) ?? false;
  }

  static Future<void> markOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_seenKey, true);
  }
}
