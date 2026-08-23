import 'package:flutter/material.dart';

/// Paleta espelhada de tailwind.config.ts (repo do backend/site), pra manter
/// a mesma identidade visual do Emacrescere.
class AppColors {
  AppColors._();

  // brand (verde-esmeralda)
  static const brand50 = Color(0xFFECFDF5);
  static const brand100 = Color(0xFFD1FAE5);
  static const brand500 = Color(0xFF10B981);
  static const brand600 = Color(0xFF059669);
  static const brand700 = Color(0xFF047857);

  // teal (acento)
  static const teal500 = Color(0xFF14B8A6);
  static const teal600 = Color(0xFF0D9488);

  // ink (neutros)
  static const ink50 = Color(0xFFF4F7FB);
  static const ink200 = Color(0xFFC6D3E2);
  static const ink600 = Color(0xFF3A4B66);
  static const ink900 = Color(0xFF0D1424);

  // semânticas
  static const success500 = Color(0xFF22C55E);
  static const warning500 = Color(0xFFF59E0B);
  static const danger500 = Color(0xFFEF4444);
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand600,
      brightness: Brightness.light,
      primary: AppColors.brand600,
      secondary: AppColors.teal600,
      error: AppColors.danger500,
      surface: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.ink50,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.ink50,
        foregroundColor: AppColors.ink900,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand600,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.ink200),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.brand600,
        unselectedItemColor: AppColors.ink600,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
