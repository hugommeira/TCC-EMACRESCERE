import 'package:emacrescere_app/models/doctor_profile.dart';
import 'package:emacrescere_app/screens/auth/register_screen.dart';
import 'package:emacrescere_app/screens/doctor/doctor_pending_screen.dart';
import 'package:emacrescere_app/screens/onboarding/onboarding_screen.dart';
import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:emacrescere_app/theme/theme_controller.dart';
import 'package:emacrescere_app/utils/formatters.dart';
import 'package:emacrescere_app/widgets/theme_setting_card.dart';
import 'package:emacrescere_app/widgets/welcome_carousel.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void _phone(WidgetTester tester) {
  tester.view.physicalSize = const Size(320, 1600);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

Widget _wrap(Widget child, {required bool dark}) => MaterialApp(
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  themeMode: dark ? ThemeMode.dark : ThemeMode.light,
  home: child,
);

/// Tema claro/escuro: padrões por perfil, persistência e as telas
/// renderizando nos dois temas a 320px sem erro de layout.
void main() {
  group('ThemeController', () {
    final c = ThemeController.instance;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      c.setAudience(ThemeAudience.patient);
      await c.setDark(false);
      c.setAudience(ThemeAudience.doctor);
      await c.setDark(true);
      c.setAudience(ThemeAudience.patient);
    });

    test('paciente começa no claro e médico no escuro', () {
      c.setAudience(ThemeAudience.patient);
      expect(c.isDark, isFalse);
      expect(c.mode, ThemeMode.light);
      c.setAudience(ThemeAudience.doctor);
      expect(c.isDark, isTrue);
      expect(c.mode, ThemeMode.dark);
    });

    test('a escolha de um perfil não muda a do outro e fica salva', () async {
      c.setAudience(ThemeAudience.patient);
      await c.toggle();
      expect(c.isDark, isTrue);

      c.setAudience(ThemeAudience.doctor);
      expect(c.isDark, isTrue);
      await c.toggle();
      expect(c.isDark, isFalse);

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('theme_dark_patient'), isTrue);
      expect(prefs.getBool('theme_dark_doctor'), isFalse);
    });
  });

  test('os dois temas carregam a paleta e o brilho certos', () {
    expect(AppTheme.light.extension<AppPalette>()!.isDark, isFalse);
    expect(AppTheme.dark.extension<AppPalette>()!.isDark, isTrue);
    expect(AppTheme.dark.brightness, Brightness.dark);
    expect(AppTheme.dark.scaffoldBackgroundColor, AppPalette.dark.surface);
  });

  test('formatDecimal usa vírgula', () {
    expect(formatDecimal(88.5), '88,5');
    expect(formatDecimal(75), '75,0');
    expect(formatDecimal(1.236, 2), '1,24');
  });

  for (final dark in [false, true]) {
    final nome = dark ? 'escuro' : 'claro';

    testWidgets('onboarding renderiza no tema $nome', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_wrap(OnboardingScreen(onFinished: () {}), dark: dark));
      await tester.pump(const Duration(milliseconds: 800));

      expect(find.text('Acompanhe sua evolução, semana a semana'), findsOneWidget);
      // A consulta tem vídeo e chat; o slide 2 diz isso.
      expect(welcomeSlides[1].text, contains('vídeo'));
      expect(tester.takeException(), isNull);
    });

    testWidgets('cadastro e espera do médico renderizam no tema $nome', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_wrap(RegisterScreen(onLoggedIn: () {}), dark: dark));
      await tester.pump();
      expect(tester.takeException(), isNull);

      await tester.pumpWidget(
        _wrap(
          const DoctorPendingScreen(
            profile: DoctorProfile(
              crm: '123456',
              crmState: 'PE',
              specialty: 'Endocrinologia',
              approvalStatus: 'PENDING',
              available: false,
            ),
            onRetry: _noop,
          ),
          dark: dark,
        ),
      );
      await tester.pump();
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('interruptor do perfil liga o tema escuro', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final c = ThemeController.instance;
    c.setAudience(ThemeAudience.patient);
    await c.setDark(false);

    _phone(tester);
    await tester.pumpWidget(_wrap(const Scaffold(body: ThemeSettingCard()), dark: false));
    expect(find.text('Tema escuro'), findsOneWidget);

    await tester.tap(find.byType(Switch));
    await tester.pump();
    expect(c.isDark, isTrue);
    await c.setDark(false);
  });
}

Future<void> _noop() async {}
