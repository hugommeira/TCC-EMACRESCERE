import 'package:emacrescere_app/models/user_profile.dart';
import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:emacrescere_app/widgets/user_avatar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('perfil lê o avatarUrl relativo do servidor', () {
    final p = UserProfile.fromJson({
      'id': 'u1',
      'name': 'Mariana',
      'email': 'm@x.com',
      'avatarUrl': '/api/avatar/u1?v=3',
    });
    expect(p.avatarUrl, '/api/avatar/u1?v=3');
  });

  testWidgets('sem foto mostra o placeholder, sem rede', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const Scaffold(body: UserAvatar(url: null, placeholder: Text('sem foto'))),
      ),
    );
    expect(find.text('sem foto'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
