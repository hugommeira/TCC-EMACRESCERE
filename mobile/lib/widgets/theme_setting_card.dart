import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/theme_controller.dart';

/// Cartão "Aparência" do perfil: o mesmo liga/desliga do botão sol/lua do
/// header, num lugar fácil de achar.
class ThemeSettingCard extends StatelessWidget {
  const ThemeSettingCard({super.key});

  @override
  Widget build(BuildContext context) {
    final themes = ThemeController.instance;
    return ListenableBuilder(
      listenable: themes,
      builder: (context, _) => Card(
        child: SwitchListTile(
          value: themes.isDark,
          onChanged: themes.setDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.cardLarge)),
          contentPadding: const EdgeInsets.fromLTRB(16, 4, 12, 4),
          secondary: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: context.colors.softGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              themes.isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
              color: context.colors.brand700,
              size: 22,
            ),
          ),
          title: Text('Tema escuro', style: Theme.of(context).textTheme.titleSmall),
          subtitle: Text(
            themes.isDark ? 'Verde-floresta, mais confortável à noite' : 'Claro, com fundo menta',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      ),
    );
  }
}
