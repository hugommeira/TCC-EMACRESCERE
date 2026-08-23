import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// Placeholder genérico pras abas ainda não implementadas.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({super.key, required this.title, required this.icon});

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppColors.ink200),
            const SizedBox(height: 16),
            Text(
              'Em construção',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.ink600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
