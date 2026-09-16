import 'package:flutter/material.dart';

/// Paleta derivada do logo Emacrescere: coração-folha em degradê esmeralda
/// (verde-escuro -> esmeralda -> menta), letreiro verde-escuro, anel fino
/// menta e fundo branco-esverdeado. Os hex da escala brand/teal/gray são os
/// mesmos do tailwind.config.ts do site, pra app e site combinarem.
class AppColors {
  AppColors._();

  // brand / emerald — o degradê do símbolo vai de brand700 a brand300
  static const brand50 = Color(0xFFECFDF5);
  static const brand100 = Color(0xFFD1FAE5);
  static const brand200 = Color(0xFFA7F3D0);
  static const brand300 = Color(0xFF6EE7B7);
  static const brand400 = Color(0xFF34D399);
  static const brand500 = Color(0xFF10B981);
  static const brand600 = Color(0xFF059669);
  static const brand700 = Color(0xFF047857);
  static const brand800 = Color(0xFF065F46);
  static const brand900 = Color(0xFF064E3B);

  // teal (secundária, usada no fim do degradê)
  static const teal400 = Color(0xFF2DD4BF);
  static const teal500 = Color(0xFF14B8A6);
  static const teal600 = Color(0xFF0D9488);

  /// Verde-folha claro das pontas do símbolo — acento pontual (badges,
  /// destaque de valor), nunca em áreas grandes.
  static const leaf = Color(0xFF8FD65A);

  /// Fundo das telas: branco puxado pro menta, como o interior do círculo
  /// do logo.
  static const surface = Color(0xFFF4FBF8);

  /// Texto principal: o verde-escuro do letreiro "Emacrescere".
  static const ink = brand800;

  // gray padrão do Tailwind pra texto secundário/bordas neutras
  static const gray50 = Color(0xFFF9FAFB);
  static const gray100 = Color(0xFFF3F4F6);
  static const gray200 = Color(0xFFE5E7EB);
  static const gray300 = Color(0xFFD1D5DB);
  static const gray400 = Color(0xFF9CA3AF);
  static const gray600 = Color(0xFF4B5563);
  static const gray700 = Color(0xFF374151);
  static const gray900 = Color(0xFF111827);

  // semânticas
  static const success500 = Color(0xFF22C55E);
  static const warning500 = Color(0xFFF59E0B);
  static const danger500 = Color(0xFFEF4444);
  static const danger600 = Color(0xFFDC2626);

  /// Degradê da marca (header, azulejos de ícone, tile do logo).
  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand700, brand500, teal400],
    stops: [0, 0.6, 1],
  );

  /// Versão suave do degradê pra fundos de ícone dentro de cards.
  static const brandGradientSoft = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand100, brand50],
  );
}

class AppRadius {
  AppRadius._();

  /// Botões e inputs: pill / bem arredondado.
  static const button = 999.0;
  static const input = 14.0;

  /// Cards: raio generoso, borda fina menta, sem sombra.
  static const card = 16.0;
  static const cardLarge = 20.0;
  static const pill = 999.0;
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand500,
      brightness: Brightness.light,
      primary: AppColors.brand600,
      onPrimary: Colors.white,
      primaryContainer: AppColors.brand100,
      onPrimaryContainer: AppColors.brand800,
      secondary: AppColors.teal500,
      onSecondary: Colors.white,
      secondaryContainer: AppColors.brand50,
      onSecondaryContainer: AppColors.brand800,
      surface: Colors.white,
      onSurface: AppColors.ink,
      onSurfaceVariant: AppColors.gray600,
      outline: AppColors.brand200,
      outlineVariant: AppColors.brand100,
      error: AppColors.danger600,
      onError: Colors.white,
    );

    const textTheme = TextTheme(
      headlineLarge: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: AppColors.ink, height: 1.15),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.ink, height: 1.2),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.ink),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.ink),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink),
      bodyLarge: TextStyle(fontSize: 16, color: AppColors.gray900, height: 1.4),
      bodyMedium: TextStyle(fontSize: 14, color: AppColors.gray600, height: 1.4),
      bodySmall: TextStyle(fontSize: 12, color: AppColors.gray600, height: 1.35),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.brand700, letterSpacing: 0.3),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.gray600),
    );

    final pill = RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button));
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.input),
      borderSide: const BorderSide(color: AppColors.brand100),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.surface,
      textTheme: textTheme,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.ink),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand600,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.brand100,
          disabledForegroundColor: AppColors.brand400,
          elevation: 0,
          minimumSize: const Size(0, 50),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.brand700,
          backgroundColor: Colors.white,
          side: const BorderSide(color: AppColors.brand200, width: 1.5),
          minimumSize: const Size(0, 50),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.brand700,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.brand500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: const BorderSide(color: AppColors.danger500),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: const TextStyle(color: AppColors.gray600),
        floatingLabelStyle: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w600),
        hintStyle: const TextStyle(color: AppColors.gray400),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.cardLarge),
          side: const BorderSide(color: AppColors.brand100),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.brand100),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.brand50,
        side: BorderSide.none,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.brand800),
        shape: pill,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.brand900,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.titleLarge,
        contentTextStyle: textTheme.bodyMedium,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: AppColors.brand100,
        indicatorShape: pill,
        height: 68,
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? AppColors.brand800 : AppColors.gray600,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected) ? AppColors.brand800 : AppColors.gray400,
          ),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.brand600),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? AppColors.brand600 : AppColors.gray400,
        ),
      ),
    );
  }
}
