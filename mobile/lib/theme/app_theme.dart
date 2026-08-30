import 'package:flutter/material.dart';

/// Paleta espelhada de tailwind.config.ts e globals.css (repo do site),
/// hex exatos — não aproximados. Fonte: brand/teal/ink/success/warning/danger
/// em tailwind.config.ts; texto/fundo/borda em app/globals.css e
/// app/layout.tsx (bg-white, text-gray-900, border-gray-200, themeColor).
class AppColors {
  AppColors._();

  // brand / emerald (primária) — themeColor do site é brand500 (#10b981)
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

  // teal (secundária/acento)
  static const teal400 = Color(0xFF2DD4BF);
  static const teal500 = Color(0xFF14B8A6);
  static const teal600 = Color(0xFF0D9488);

  // gray padrão do Tailwind — é o que o site usa pra texto/borda/fundo
  // (não a escala "ink" customizada, que no site só aparece declarada,
  // sem uso real em texto/fundo)
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
}

/// Raios de borda reais do site (app/globals.css): botões/inputs usam
/// rounded-lg (8px), cards usam rounded-xl (12px), badges usam
/// rounded-full (pill). NÃO são os 20/28px de um design pill genérico.
class AppRadius {
  AppRadius._();

  static const button = 8.0;
  static const card = 12.0;
  static const pill = 999.0;

  /// Raio bem arredondado usado nas telas redesenhadas seguindo as
  /// referências visuais pixel a pixel (Home/Consultas) — maior que o
  /// `card` padrão que segue o site real.
  static const cardLarge = 22.0;
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand500,
      brightness: Brightness.light,
      primary: AppColors.brand500,
      onPrimary: Colors.white,
      secondary: AppColors.teal600,
      onSecondary: Colors.white,
      surface: Colors.white,
      onSurface: AppColors.gray900,
      error: AppColors.danger600,
      onError: Colors.white,
    );

    const textTheme = TextTheme(
      headlineLarge: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: AppColors.gray900),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.gray900),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.gray900),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.gray900),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.gray700),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.gray700),
      bodyLarge: TextStyle(fontSize: 16, color: AppColors.gray900),
      bodyMedium: TextStyle(fontSize: 14, color: AppColors.gray600),
      bodySmall: TextStyle(fontSize: 12, color: AppColors.gray600),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.gray700),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.gray600),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.gray600),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: Colors.white,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.gray900,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.gray900),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.button),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.primary,
          side: BorderSide(color: colorScheme.primary),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.button),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: colorScheme.primary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
          borderSide: const BorderSide(color: AppColors.gray300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
          borderSide: const BorderSide(color: AppColors.gray300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.button),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
        ),
        labelStyle: const TextStyle(color: AppColors.gray600),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: const BorderSide(color: AppColors.gray200),
        ),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.gray200),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.brand600,
        unselectedItemColor: AppColors.gray400,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}
