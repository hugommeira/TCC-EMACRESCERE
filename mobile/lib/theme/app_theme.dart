import 'package:flutter/material.dart';

/// Paleta derivada do logo Emacrescere: coração-folha em degradê esmeralda
/// (verde-escuro -> esmeralda -> menta), letreiro verde-escuro, anel fino
/// menta e fundo branco-esverdeado. Os hex da escala brand/teal/gray são os
/// mesmos do tailwind.config.ts do site, pra app e site combinarem.
///
/// Estas são as cores FIXAS da marca, iguais nos dois temas: use-as no que
/// não muda com o tema (degradês, botão esmeralda com texto branco, texto
/// branco sobre o header verde). Para fundo, texto, borda e afins use
/// `context.colors` ([AppPalette]), que troca entre claro e escuro.
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

  /// Degradê do header das abas no redesenho (prancheta "Início").
  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand700, brand600, teal500],
    stops: [0, 0.52, 1],
  );

  /// O mesmo degradê, mais fundo, para o tema escuro (o claro ofuscava ao
  /// lado do fundo quase preto).
  static const brandGradientDeep = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand900, brand800, teal600],
    stops: [0, 0.55, 1],
  );

  /// Versão suave do degradê pra fundos de ícone dentro de cards (tema claro).
  static const brandGradientSoft = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand100, brand50],
  );
}

/// Cores que mudam com o tema. Os nomes espelham os de [AppColors] para a
/// troca ser direta: `AppColors.gray600` (texto secundário) vira
/// `context.colors.gray600`, que no escuro é um menta acinzentado legível.
///
/// Regra de leitura dos nomes no escuro: os tons CLAROS da escala (50–300,
/// gray50–300) viram fundos e bordas escuros; os tons ESCUROS (700–900, ink,
/// gray600–900) viram textos claros. Por isso um fundo que precisa continuar
/// esmeralda com texto branco usa [AppColors], não esta paleta.
@immutable
class AppPalette extends ThemeExtension<AppPalette> {
  const AppPalette({
    required this.isDark,
    required this.surface,
    required this.card,
    required this.headerGradient,
    required this.softGradient,
    required this.brand50,
    required this.brand100,
    required this.brand200,
    required this.brand300,
    required this.brand400,
    required this.brand500,
    required this.brand600,
    required this.brand700,
    required this.brand800,
    required this.brand900,
    required this.ink,
    required this.gray50,
    required this.gray100,
    required this.gray200,
    required this.gray300,
    required this.gray400,
    required this.gray600,
    required this.gray700,
    required this.gray900,
    required this.teal400,
    required this.teal500,
    required this.teal600,
    required this.success500,
    required this.warning500,
    required this.danger500,
    required this.danger600,
    required this.warningBg,
    required this.warningFg,
    required this.dangerBg,
  });

  final bool isDark;

  /// Fundo das telas.
  final Color surface;

  /// Fundo de cards, sheets, diálogos e campos (o `Colors.white` do claro).
  final Color card;

  final Gradient headerGradient;
  final Gradient softGradient;

  final Color brand50, brand100, brand200, brand300, brand400;
  final Color brand500, brand600, brand700, brand800, brand900;
  final Color ink;
  final Color gray50, gray100, gray200, gray300, gray400, gray600, gray700, gray900;
  final Color teal400, teal500, teal600;
  final Color success500, warning500, danger500, danger600;

  /// Fundo e texto de selos de aviso (ex.: faixa de IMC acima do normal).
  final Color warningBg, warningFg;

  /// Fundo suave de erro (banners de falha).
  final Color dangerBg;

  static const light = AppPalette(
    isDark: false,
    surface: AppColors.surface,
    card: Colors.white,
    headerGradient: AppColors.heroGradient,
    softGradient: AppColors.brandGradientSoft,
    brand50: AppColors.brand50,
    brand100: AppColors.brand100,
    brand200: AppColors.brand200,
    brand300: AppColors.brand300,
    brand400: AppColors.brand400,
    brand500: AppColors.brand500,
    brand600: AppColors.brand600,
    brand700: AppColors.brand700,
    brand800: AppColors.brand800,
    brand900: AppColors.brand900,
    ink: AppColors.ink,
    gray50: AppColors.gray50,
    gray100: AppColors.gray100,
    gray200: AppColors.gray200,
    gray300: AppColors.gray300,
    gray400: AppColors.gray400,
    gray600: AppColors.gray600,
    gray700: AppColors.gray700,
    gray900: AppColors.gray900,
    teal400: AppColors.teal400,
    teal500: AppColors.teal500,
    teal600: AppColors.teal600,
    success500: AppColors.success500,
    warning500: AppColors.warning500,
    danger500: AppColors.danger500,
    danger600: AppColors.danger600,
    warningBg: Color(0xFFFEF3C7),
    warningFg: Color(0xFF92400E),
    dangerBg: Color(0xFFFEF2F2),
  );

  /// Verde-floresta profundo com destaques em menta: a mesma marca, sem
  /// virar cinza genérico.
  static const dark = AppPalette(
    isDark: true,
    surface: Color(0xFF0B1F19),
    card: Color(0xFF10302A),
    headerGradient: AppColors.brandGradientDeep,
    softGradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF163D33), Color(0xFF0F2A23)],
    ),
    brand50: Color(0xFF0F2A23),
    brand100: Color(0xFF1B4A3E),
    brand200: Color(0xFF1F6B55),
    brand300: Color(0xFF2F8F72),
    brand400: Color(0xFF34D399),
    brand500: Color(0xFF34D399),
    brand600: Color(0xFF6EE7B7),
    brand700: Color(0xFF6EE7B7),
    brand800: Color(0xFFD1FAE5),
    brand900: Color(0xFFECFDF5),
    ink: Color(0xFFECFDF5),
    gray50: Color(0xFF0B1F19),
    gray100: Color(0xFF163D33),
    gray200: Color(0xFF1B4A3E),
    gray300: Color(0xFF2A5A4D),
    gray400: Color(0xFF7FA89A),
    gray600: Color(0xFFA7C9BD),
    gray700: Color(0xFFCFE3DB),
    gray900: Color(0xFFECFDF5),
    teal400: AppColors.teal400,
    teal500: AppColors.teal400,
    teal600: AppColors.teal400,
    success500: Color(0xFF4ADE80),
    warning500: Color(0xFFFBBF24),
    danger500: Color(0xFFF87171),
    danger600: Color(0xFFF87171),
    warningBg: Color(0x2EF59E0B),
    warningFg: Color(0xFFFCD34D),
    dangerBg: Color(0x26F87171),
  );

  @override
  AppPalette copyWith() => this;

  @override
  AppPalette lerp(ThemeExtension<AppPalette>? other, double t) {
    if (other is! AppPalette) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppPalette(
      isDark: t < 0.5 ? isDark : other.isDark,
      surface: c(surface, other.surface),
      card: c(card, other.card),
      headerGradient: t < 0.5 ? headerGradient : other.headerGradient,
      softGradient: t < 0.5 ? softGradient : other.softGradient,
      brand50: c(brand50, other.brand50),
      brand100: c(brand100, other.brand100),
      brand200: c(brand200, other.brand200),
      brand300: c(brand300, other.brand300),
      brand400: c(brand400, other.brand400),
      brand500: c(brand500, other.brand500),
      brand600: c(brand600, other.brand600),
      brand700: c(brand700, other.brand700),
      brand800: c(brand800, other.brand800),
      brand900: c(brand900, other.brand900),
      ink: c(ink, other.ink),
      gray50: c(gray50, other.gray50),
      gray100: c(gray100, other.gray100),
      gray200: c(gray200, other.gray200),
      gray300: c(gray300, other.gray300),
      gray400: c(gray400, other.gray400),
      gray600: c(gray600, other.gray600),
      gray700: c(gray700, other.gray700),
      gray900: c(gray900, other.gray900),
      teal400: c(teal400, other.teal400),
      teal500: c(teal500, other.teal500),
      teal600: c(teal600, other.teal600),
      success500: c(success500, other.success500),
      warning500: c(warning500, other.warning500),
      danger500: c(danger500, other.danger500),
      danger600: c(danger600, other.danger600),
      warningBg: c(warningBg, other.warningBg),
      warningFg: c(warningFg, other.warningFg),
      dangerBg: c(dangerBg, other.dangerBg),
    );
  }
}


/// Tokens do redesenho (canvas "Emacrescere App — Redesign"), com os mesmos
/// nomes das variáveis CSS das pranchetas (--title, --muted, --chip...).
/// As telas novas usam estes; a [AppPalette] continua para o resto do app.
@immutable
class DesignTokens extends ThemeExtension<DesignTokens> {
  const DesignTokens({
    required this.bg,
    required this.card,
    required this.line,
    required this.line2,
    required this.soft,
    required this.tint,
    required this.chip,
    required this.chipFg,
    required this.title,
    required this.text,
    required this.muted,
    required this.body,
    required this.link,
    required this.feature,
    required this.navBg,
    required this.navFg,
    required this.navOnBg,
    required this.navOnFg,
    required this.shadow,
    required this.track,
    required this.grid,
    required this.axis,
    required this.dash,
    required this.plot,
    required this.dotFill,
    required this.segOn,
    required this.busy,
    required this.busyFg,
    required this.sel,
    required this.selFg,
    required this.dotOff,
    required this.blobA,
    required this.blobB,
    required this.glow,
    required this.ring,
    required this.receiptHero,
    required this.bubble,
  });

  final Color bg, card, line, line2, soft, tint, chip, chipFg;
  final Color title, text, muted, body, link, feature;
  final Color navBg, navFg, navOnBg, navOnFg, shadow;
  final Color track, grid, axis, dash, plot, dotFill, segOn;
  final Color busy, busyFg, sel, selFg, dotOff;
  final Color blobA, blobB, glow, ring, bubble;
  final Gradient receiptHero;

  static const light = DesignTokens(
    bg: Color(0xFFF4FBF8),
    card: Color(0xFFFFFFFF),
    line: Color(0xFFD1FAE5),
    line2: Color(0xFFA7F3D0),
    soft: Color(0xFFF4FBF8),
    tint: Color(0xFFECFDF5),
    chip: Color(0xFFD1FAE5),
    chipFg: Color(0xFF047857),
    title: Color(0xFF064E3B),
    text: Color(0xFF065F46),
    muted: Color(0xFF4B5563),
    body: Color(0xFF374151),
    link: Color(0xFF047857),
    feature: Color(0xFF064E3B),
    navBg: Color(0xE0FFFFFF),
    navFg: Color(0xFF6B7280),
    navOnBg: Color(0xFFD1FAE5),
    navOnFg: Color(0xFF047857),
    shadow: Color(0x73065F46),
    track: Color(0xFFECFDF5),
    grid: Color(0xFFECFDF5),
    axis: Color(0xFF6B7280),
    dash: Color(0xFFA7F3D0),
    plot: Color(0xFF047857),
    dotFill: Color(0xFFFFFFFF),
    segOn: Color(0xFFFFFFFF),
    busy: Color(0xFFE5E7EB),
    busyFg: Color(0xFF6B7280),
    sel: Color(0xFF064E3B),
    selFg: Color(0xFFFFFFFF),
    dotOff: Color(0xFFA7F3D0),
    blobA: Color(0xF2A7F3D0),
    blobB: Color(0x472DD4BF),
    glow: Color(0x5910B981),
    ring: Color(0x5910B981),
    bubble: Color(0xFFFFFFFF),
    receiptHero: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF064E3B), Color(0xFF065F46), Color(0xFF047857)],
      stops: [0, 0.55, 1],
    ),
  );

  static const dark = DesignTokens(
    bg: Color(0xFF0B1F19),
    card: Color(0xFF10302A),
    line: Color(0xFF1B4A3E),
    line2: Color(0xFF1F6B55),
    soft: Color(0xFF0F2A23),
    tint: Color(0xFF123A2F),
    chip: Color(0xFF163D33),
    chipFg: Color(0xFF6EE7B7),
    title: Color(0xFFFFFFFF),
    text: Color(0xFFECFDF5),
    muted: Color(0xFFA7F3D0),
    body: Color(0xFFD1FAE5),
    link: Color(0xFF6EE7B7),
    feature: Color(0xFF133F33),
    navBg: Color(0xE610302A),
    navFg: Color(0xFF9CA3AF),
    navOnBg: Color(0x2E10B981),
    navOnFg: Color(0xFF6EE7B7),
    shadow: Color(0x99000000),
    track: Color(0xFF163D33),
    grid: Color(0xFF1B4A3E),
    axis: Color(0xFFA7F3D0),
    dash: Color(0xFF1F6B55),
    plot: Color(0xFF6EE7B7),
    dotFill: Color(0xFF10302A),
    segOn: Color(0xFF1F5A4A),
    busy: Color(0xFF16241F),
    busyFg: Color(0xFF6B7F78),
    sel: Color(0xFF6EE7B7),
    selFg: Color(0xFF052E22),
    dotOff: Color(0xFF1F6B55),
    blobA: Color(0x4D10B981),
    blobB: Color(0x2E2DD4BF),
    glow: Color(0x4D34D399),
    ring: Color(0x596EE7B7),
    bubble: Color(0xFF123A2F),
    receiptHero: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF0F2A23), Color(0xFF123A2F), Color(0xFF065F46)],
      stops: [0, 0.55, 1],
    ),
  );

  @override
  DesignTokens copyWith() => this;

  @override
  DesignTokens lerp(ThemeExtension<DesignTokens>? other, double t) {
    if (other is! DesignTokens) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return DesignTokens(
      bg: c(bg, other.bg),
      card: c(card, other.card),
      line: c(line, other.line),
      line2: c(line2, other.line2),
      soft: c(soft, other.soft),
      tint: c(tint, other.tint),
      chip: c(chip, other.chip),
      chipFg: c(chipFg, other.chipFg),
      title: c(title, other.title),
      text: c(text, other.text),
      muted: c(muted, other.muted),
      body: c(body, other.body),
      link: c(link, other.link),
      feature: c(feature, other.feature),
      navBg: c(navBg, other.navBg),
      navFg: c(navFg, other.navFg),
      navOnBg: c(navOnBg, other.navOnBg),
      navOnFg: c(navOnFg, other.navOnFg),
      shadow: c(shadow, other.shadow),
      track: c(track, other.track),
      grid: c(grid, other.grid),
      axis: c(axis, other.axis),
      dash: c(dash, other.dash),
      plot: c(plot, other.plot),
      dotFill: c(dotFill, other.dotFill),
      segOn: c(segOn, other.segOn),
      busy: c(busy, other.busy),
      busyFg: c(busyFg, other.busyFg),
      sel: c(sel, other.sel),
      selFg: c(selFg, other.selFg),
      dotOff: c(dotOff, other.dotOff),
      blobA: c(blobA, other.blobA),
      blobB: c(blobB, other.blobB),
      glow: c(glow, other.glow),
      ring: c(ring, other.ring),
      bubble: c(bubble, other.bubble),
      receiptHero: t < 0.5 ? receiptHero : other.receiptHero,
    );
  }
}

/// Estilos de texto do redesenho.
class AppType {
  AppType._();

  static const display = 'Fraunces';
  static const sans = 'Inter';

  /// Título em Fraunces 700 (os números grandes e títulos das pranchetas).
  static TextStyle title(double size, Color color, {double height = 1.08, FontWeight weight = FontWeight.w700}) =>
      TextStyle(
        fontFamily: display,
        fontWeight: weight,
        fontSize: size,
        height: height,
        letterSpacing: -0.02 * size,
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      );

  static TextStyle sansStyle(double size, Color color, {FontWeight weight = FontWeight.w400, double? height}) =>
      TextStyle(fontFamily: sans, fontSize: size, fontWeight: weight, color: color, height: height);

  /// Rótulo em caixa alta com espaçamento (ex.: "PRÓXIMA CONSULTA").
  static TextStyle eyebrow(Color color, {double size = 12}) => TextStyle(
        fontFamily: sans,
        fontSize: size,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.08 * size,
        color: color,
      );
}

extension AppPaletteContext on BuildContext {
  /// Cores do tema atual (claro ou escuro). Ler por aqui faz o widget
  /// reconstruir quando o tema troca.
  AppPalette get colors => Theme.of(this).extension<AppPalette>() ?? AppPalette.light;

  /// Tokens exatos do redesenho.
  DesignTokens get ds => Theme.of(this).extension<DesignTokens>() ?? DesignTokens.light;
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

  static final ThemeData light = _build(AppPalette.light);

  static final ThemeData dark = _build(AppPalette.dark);

  static ThemeData _build(AppPalette p) {
    final brightness = p.isDark ? Brightness.dark : Brightness.light;
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand500,
      brightness: brightness,
      primary: p.isDark ? AppColors.brand400 : AppColors.brand600,
      onPrimary: p.isDark ? AppColors.brand900 : Colors.white,
      primaryContainer: p.brand100,
      onPrimaryContainer: p.brand800,
      secondary: p.isDark ? AppColors.teal400 : AppColors.teal500,
      onSecondary: p.isDark ? AppColors.brand900 : Colors.white,
      secondaryContainer: p.brand50,
      onSecondaryContainer: p.brand800,
      surface: p.card,
      onSurface: p.ink,
      onSurfaceVariant: p.gray600,
      outline: p.brand200,
      outlineVariant: p.brand100,
      error: p.danger600,
      onError: Colors.white,
    );

    final textTheme = TextTheme(
      headlineLarge: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: p.ink, height: 1.15),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: p.ink, height: 1.2),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: p.ink),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: p.ink),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: p.ink),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: p.ink),
      bodyLarge: TextStyle(fontSize: 16, color: p.gray900, height: 1.4),
      bodyMedium: TextStyle(fontSize: 14, color: p.gray600, height: 1.4),
      bodySmall: TextStyle(fontSize: 12, color: p.gray600, height: 1.35),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: p.ink),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p.brand700, letterSpacing: 0.3),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: p.gray600),
    );

    final pill = RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button));
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.input),
      borderSide: BorderSide(color: p.brand100),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      extensions: [p, p.isDark ? DesignTokens.dark : DesignTokens.light],
      fontFamily: AppType.sans,
      scaffoldBackgroundColor: p.surface,
      canvasColor: p.surface,
      textTheme: textTheme,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: p.surface,
        foregroundColor: p.ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: p.ink),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          // Esmeralda com texto branco nos dois temas.
          backgroundColor: AppColors.brand600,
          foregroundColor: Colors.white,
          disabledBackgroundColor: p.brand100,
          disabledForegroundColor: p.isDark ? p.gray400 : AppColors.brand400,
          elevation: 0,
          minimumSize: const Size(0, 50),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: p.brand700,
          backgroundColor: p.card,
          side: BorderSide(color: p.brand200, width: 1.5),
          minimumSize: const Size(0, 50),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: p.brand700,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: p.card,
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: BorderSide(color: p.brand500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.input),
          borderSide: BorderSide(color: p.danger500),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: TextStyle(color: p.gray600),
        floatingLabelStyle: TextStyle(color: p.brand700, fontWeight: FontWeight.w600),
        hintStyle: TextStyle(color: p.gray400),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: p.card,
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.cardLarge),
          side: BorderSide(color: p.brand100),
        ),
      ),
      dividerTheme: DividerThemeData(color: p.brand100),
      chipTheme: ChipThemeData(
        backgroundColor: p.brand50,
        selectedColor: p.brand100,
        side: BorderSide.none,
        labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p.brand800),
        checkmarkColor: p.brand700,
        shape: pill,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: p.isDark ? const Color(0xFF163D33) : AppColors.brand900,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: p.card,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.titleLarge,
        contentTextStyle: textTheme.bodyMedium,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: p.card,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: p.card,
        surfaceTintColor: Colors.transparent,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: p.card,
        surfaceTintColor: Colors.transparent,
        indicatorColor: p.brand100,
        indicatorShape: pill,
        height: 68,
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? p.brand800 : p.gray600,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected) ? p.brand800 : p.gray400,
          ),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.white : p.gray400,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? AppColors.brand500 : p.gray200,
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: p.brand600),
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? p.brand600 : p.gray400,
        ),
      ),
    );
  }
}
