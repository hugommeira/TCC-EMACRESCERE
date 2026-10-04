import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'constants.dart';
import 'screens/startup/startup_gate.dart';
import 'theme/app_theme.dart';
import 'theme/theme_controller.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await ThemeController.instance.load();
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
