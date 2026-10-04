import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Quem está usando o app agora: paciente e médico têm tema independente
/// (são experiências diferentes — o médico começa no escuro).
enum ThemeAudience { patient, doctor }

/// Tema claro/escuro escolhido pelo usuário, salvo no aparelho.
///
/// Cada perfil guarda a própria escolha. Quem ainda não escolheu fica no
/// padrão do perfil: paciente claro, médico escuro. O [StartupGate] avisa
/// qual perfil entrou ([setAudience]); o `MaterialApp` escuta este
/// controlador e troca o tema na hora, sem perder a navegação.
class ThemeController extends ChangeNotifier {
  ThemeController._();

  static final ThemeController instance = ThemeController._();

  static const _keys = {
    ThemeAudience.patient: 'theme_dark_patient',
    ThemeAudience.doctor: 'theme_dark_doctor',
  };

  static const _defaults = {ThemeAudience.patient: false, ThemeAudience.doctor: true};

  ThemeAudience _audience = ThemeAudience.patient;
  final Map<ThemeAudience, bool> _dark = Map.of(_defaults);

  ThemeAudience get audience => _audience;
  bool get isDark => _dark[_audience]!;
  ThemeMode get mode => isDark ? ThemeMode.dark : ThemeMode.light;

  /// Lê as escolhas salvas. Sem nada salvo (ou sem acesso ao
  /// armazenamento), fica nos padrões.
  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final a in ThemeAudience.values) {
        final saved = prefs.getBool(_keys[a]!);
        if (saved != null) _dark[a] = saved;
      }
    } catch (_) {
      // Mantém os padrões.
    }
    notifyListeners();
  }

  void setAudience(ThemeAudience audience) {
    if (_audience == audience) return;
    _audience = audience;
    notifyListeners();
  }

  Future<void> setDark(bool value) async {
    if (_dark[_audience] == value) return;
    _dark[_audience] = value;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keys[_audience]!, value);
    } catch (_) {
      // Sem persistência: a escolha vale até fechar o app.
    }
  }

  Future<void> toggle() => setDark(!isDark);
}
