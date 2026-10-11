import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'constants.dart';
import 'screens/startup/startup_gate.dart';
import 'services/session_guard.dart';
import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeController.instance.load();
  // Para onde o app volta quando a sessão expira (SessionGuard).
  SessionGuard.homeBuilder = () => const StartupGate();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themes = ThemeController.instance;
    return ListenableBuilder(
      listenable: themes,
      builder: (context, _) => MaterialApp(
        title: 'Emacrescere',
        navigatorKey: SessionGuard.navigatorKey,
        scaffoldMessengerKey: SessionGuard.messengerKey,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: themes.mode,
        themeAnimationDuration: const Duration(milliseconds: 450),
        themeAnimationCurve: Curves.easeOutCubic,
        debugShowCheckedModeBanner: false,
        // Date/time pickers e textos padrão do Material em português.
        locale: const Locale('pt', 'BR'),
        supportedLocales: const [Locale('pt', 'BR')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        // Faixa no canto para ninguém confundir os dados de exemplo com reais.
        builder: kDemoApi
            ? (context, child) => Banner(
                  message: 'DEMO',
                  location: BannerLocation.topStart,
                  color: const Color(0xFFB45309),
                  child: child!,
                )
            : null,
        home: const StartupGate(),
      ),
    );
  }
}
