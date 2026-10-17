import 'package:emacrescere_app/models/user_profile.dart';
import 'package:emacrescere_app/screens/profile/change_password_sheet.dart';
import 'package:emacrescere_app/screens/profile/edit_profile_sheet.dart';
import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _wrap(Widget child, {required bool dark}) => MaterialApp(
  theme: AppTheme.light,
  darkTheme: AppTheme.dark,
  themeMode: dark ? ThemeMode.dark : ThemeMode.light,
  home: Scaffold(body: child),
);

void _phone(WidgetTester tester) {
  tester.view.physicalSize = const Size(320, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

/// Edição do perfil (PATCH /api/profile) e troca de senha: renderizam a 320px
/// nos dois temas; o médico vê só nome e telefone.
void main() {
  final patient = UserProfile.fromJson({
    'id': 'u1',
    'name': 'Mariana Castro',
    'email': 'mariana.castro@email.com',
    'role': 'PATIENT',
    'phone': '81999998888',
    'patientProfile': {
      'birthDate': '1990-05-10T03:00:00.000Z',
      'gender': 'Feminino',
      'bloodType': 'O+',
      'allergies': ['Dipirona'],
      'medications': [],
      'heightCm': 165,
      'goalWeightKg': '68.50',
      'emergencyContactName': 'Ana Castro',
      'emergencyContactPhone': '81988887777',
      'emergencyContactRelation': 'mãe',
    },
  });

  test('lê os campos novos (meta em texto, como o Decimal do Prisma)', () {
    expect(patient.heightCm, 165);
    expect(patient.goalWeightKg, 68.5);
    expect(patient.emergencyContactRelation, 'mãe');
  });

  for (final dark in [false, true]) {
    final tema = dark ? 'escuro' : 'claro';

    testWidgets('editar perfil da paciente renderiza no tema $tema', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_wrap(EditProfileSheet(profile: patient), dark: dark));
      expect(find.text('Contato de emergência'), findsOneWidget);
      expect(find.text('Altura (cm)'), findsOneWidget);
      expect(find.text('10/05/1990'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('trocar senha renderiza no tema $tema', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_wrap(const ChangePasswordSheet(), dark: dark));
      expect(find.text('Senha atual'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('médico edita só nome e telefone', (tester) async {
    _phone(tester);
    final doctor = UserProfile.fromJson({
      'id': 'd1',
      'name': 'Fernanda Costa',
      'email': 'fernanda.costa@demo.emacrescere.app',
      'role': 'DOCTOR',
    });
    await tester.pumpWidget(_wrap(EditProfileSheet(profile: doctor), dark: true));
    expect(find.text('Telefone'), findsOneWidget);
    expect(find.text('Contato de emergência'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
