import 'package:emacrescere_app/models/doctor_profile.dart';
import 'package:emacrescere_app/screens/auth/credential_check_dialog.dart';
import 'package:emacrescere_app/screens/auth/register_screen.dart';
import 'package:emacrescere_app/screens/doctor/doctor_pending_screen.dart';
import 'package:emacrescere_app/services/auth_service.dart';
import 'package:emacrescere_app/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Widget _wrap(Widget child) => MaterialApp(theme: AppTheme.light, home: child);

void _phone(WidgetTester tester) {
  tester.view.physicalSize = const Size(320, 1600);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

/// Cadastro/credenciamento do médico — layout e fluxo do diálogo de
/// verificação (simulada). Sem rede: o submit é injetado.
void main() {
  testWidgets('RegisterScreen mostra campos do CRM só no modo Médico', (tester) async {
    _phone(tester);
    await tester.pumpWidget(_wrap(RegisterScreen(onLoggedIn: () {})));
    await tester.pump();

    expect(find.text('Criar conta'), findsWidgets);
    expect(find.text('CRM'), findsNothing);

    await tester.tap(find.text('Médico(a)'));
    await tester.pumpAndSettle();

    expect(find.text('CRM'), findsOneWidget);
    expect(find.text('Especialidade'), findsOneWidget);
    expect(find.text('Verificar e enviar cadastro'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('CredentialCheckDialog fecha com null quando o cadastro passa', (tester) async {
    _phone(tester);
    RegisterFailure? result = const RegisterFailure(message: 'nao rodou');
    await tester.pumpWidget(_wrap(Builder(
      builder: (context) => ElevatedButton(
        onPressed: () async {
          result = await CredentialCheckDialog.run(
            context,
            crm: '123456',
            crmState: 'SP',
            submit: () async => null,
          );
        },
        child: const Text('go'),
      ),
    )));

    await tester.tap(find.text('go'));
    await tester.pump();
    expect(find.text('Verificando credenciamento'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    expect(result, isNull);
    expect(find.text('Verificando credenciamento'), findsNothing);
  });

  testWidgets('CredentialCheckDialog mostra falha do conselho e devolve o erro', (tester) async {
    _phone(tester);
    RegisterFailure? result;
    await tester.pumpWidget(_wrap(Builder(
      builder: (context) => ElevatedButton(
        onPressed: () async {
          result = await CredentialCheckDialog.run(
            context,
            crm: '123000',
            crmState: 'SP',
            submit: () async => const RegisterFailure(
              message: 'CRM 123000/SP não encontrado no conselho (verificação simulada).',
            ),
          );
        },
        child: const Text('go'),
      ),
    )));

    await tester.tap(find.text('go'));
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();

    expect(find.textContaining('não encontrado no conselho'), findsOneWidget);
    await tester.tap(find.text('Corrigir dados'));
    await tester.pumpAndSettle();
    expect(result?.message, contains('não encontrado'));
  });

  testWidgets('DoctorPendingScreen renderiza pendente e reprovado', (tester) async {
    _phone(tester);
    const pending = DoctorProfile(
      crm: '123456',
      crmState: 'SP',
      specialty: 'Endocrinologia',
      approvalStatus: 'PENDING',
      available: false,
      crmSituation: 'ATIVO',
    );
    await tester.pumpWidget(_wrap(DoctorPendingScreen(profile: pending, onRetry: () async {})));
    await tester.pump();
    expect(find.text('Credenciamento em análise'), findsOneWidget);
    expect(find.text('Verificar novamente'), findsOneWidget);
    expect(tester.takeException(), isNull);

    const rejected = DoctorProfile(
      crm: '123456',
      crmState: 'SP',
      specialty: 'Endocrinologia',
      approvalStatus: 'REJECTED',
      approvalNote: 'CRM não confere com o nome.',
      available: false,
    );
    await tester.pumpWidget(_wrap(DoctorPendingScreen(profile: rejected, onRetry: () async {})));
    await tester.pump();
    expect(find.text('Cadastro não aprovado'), findsOneWidget);
    expect(find.text('CRM não confere com o nome.'), findsOneWidget);
    expect(find.text('Verificar novamente'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
