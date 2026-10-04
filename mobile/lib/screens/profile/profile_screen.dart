import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/auth_service.dart';
import '../../services/user_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/curved_header_scaffold.dart';
import '../startup/startup_gate.dart';
import 'edit_profile_sheet.dart';
import '../../widgets/theme_setting_card.dart';

/// Perfil do paciente — dados de User + PatientProfile
/// (GET/PATCH /api/users/[id]).
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  SessionUser? _user;
  UserProfile? _profile;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = await AuthService.checkSession();
      if (user?.id == null) throw StateError('Sessão inválida');
      final profile = await UserService.getProfile(user!.id!);
      if (!mounted) return;
      setState(() {
        _user = user;
        _profile = profile;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Não foi possível carregar seu perfil: $e';
      });
    }
  }

  Future<void> _editHealthInfo() async {
    final profile = _profile;
    if (profile == null) return;
    final saved = await EditProfileSheet.show(context, profile);
    if (saved == true) await _load();
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da conta?'),
        content: const Text('Você vai precisar entrar de novo pra acessar seu acompanhamento.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: context.colors.danger600),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    await AuthService.logout();
    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const StartupGate()),
      (route) => false,
    );
  }

  String _joinOrEmpty(List<String> items, String emptyLabel) =>
      items.isEmpty ? emptyLabel : items.join(', ');

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null || _profile == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error ?? 'Perfil indisponível', textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(onPressed: _load, child: const Text('Tentar de novo')),
              ],
            ),
          ),
        ),
      );
    }

    final profile = _profile!;

    return CurvedHeaderScaffold(
      user: _user,
      onRefresh: _load,
      overlapCard: _IdentityCard(profile: profile, onEdit: _editHealthInfo),
      children: [
        _SectionCard(
          title: 'Dados pessoais',
          children: [
            _FieldView(label: 'CPF', value: profile.cpf ?? 'Não informado'),
            _FieldView(label: 'Telefone', value: profile.phone ?? 'Não informado'),
            _FieldView(
              label: 'Data de nascimento',
              value: profile.birthDate != null ? formatDateOnly(profile.birthDate!) : 'Não informado',
            ),
            _FieldView(
              label: 'Sexo',
              value: _genderLabel(profile.gender),
              last: true,
            ),
          ],
        ),
        const SizedBox(height: 16),
        _SectionCard(
          title: 'Informações de saúde',
          children: [
            _FieldView(label: 'Tipo sanguíneo', value: profile.bloodType ?? 'Não informado'),
            _FieldView(
              label: 'Alergias',
              value: _joinOrEmpty(profile.allergies, 'Nenhuma registrada'),
            ),
            _FieldView(
              label: 'Medicamentos em uso',
              value: _joinOrEmpty(profile.medications, 'Nenhum registrado'),
            ),
            _FieldView(
              label: 'Observações',
              value: (profile.notes == null || profile.notes!.isEmpty) ? 'Nenhuma' : profile.notes!,
              last: true,
            ),
          ],
        ),
        const SizedBox(height: 24),
        const ThemeSettingCard(),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _logout,
          icon: const Icon(Icons.logout, size: 18),
          label: const Text('Sair da conta'),
          style: OutlinedButton.styleFrom(
            foregroundColor: context.colors.danger600,
            side: BorderSide(color: context.colors.danger500),
          ),
        ),
      ],
    );
  }

  // gender é texto livre no backend (String?), sem enum.
  static String _genderLabel(String? gender) =>
      (gender == null || gender.isEmpty) ? 'Não informado' : gender;
}

/// Card sobreposto ao header: nome, e-mail, telefone e o botão Editar.
/// Altura livre — o texto quebra linha à vontade.
class _IdentityCard extends StatelessWidget {
  const _IdentityCard({required this.profile, required this.onEdit});

  final UserProfile profile;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(profile.name, style: textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(profile.email, style: textTheme.bodyMedium),
            if (profile.phone != null && profile.phone!.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(profile.phone!, style: textTheme.bodySmall),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 18),
                label: const Text('Editar informações'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _FieldView extends StatelessWidget {
  const _FieldView({required this.label, required this.value, this.last = false});

  final String label;
  final String value;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 2),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
