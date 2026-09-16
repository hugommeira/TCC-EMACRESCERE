import 'package:flutter/material.dart';

import '../../models/doctor_profile.dart';
import '../../services/auth_service.dart';
import '../../services/doctor_service.dart';
import '../../utils/formatters.dart';
import '../../theme/app_theme.dart';
import '../../widgets/curved_header_scaffold.dart';
import '../startup/startup_gate.dart';

/// Perfil do médico (GET/PATCH /api/doctor/profile): dados do conselho,
/// status do credenciamento e o interruptor "disponível pra atender".
/// Edição de bio/valor/horários fica no site.
class DoctorProfileScreen extends StatefulWidget {
  const DoctorProfileScreen({super.key});

  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> {
  SessionUser? _user;
  DoctorProfile? _profile;
  bool _loading = true;
  bool _toggling = false;
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
      final profile = await DoctorService.getProfile();
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

  Future<void> _setAvailable(bool value) async {
    setState(() => _toggling = true);
    try {
      final updated = await DoctorService.setAvailable(value);
      if (mounted) setState(() => _profile = updated);
    } on DoctorFailure catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da conta?'),
        content: const Text('Você deixa de receber pacientes da fila enquanto estiver fora.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancelar')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
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

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final profile = _profile;
    if (_error != null || profile == null) {
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

    final textTheme = Theme.of(context).textTheme;
    final fee = profile.consultationFee;

    return CurvedHeaderScaffold(
      user: _user,
      headerTitle: doctorHeaderTitle(_user?.name),
      onRefresh: _load,
      overlapCard: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_user?.name ?? '', style: textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(profile.specialty, style: textTheme.bodyMedium),
              Text(profile.crmLabel, style: textTheme.bodySmall),
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.verified_rounded, color: AppColors.brand600, size: 18),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Credenciado pela Emacrescere',
                      style: textTheme.bodySmall?.copyWith(color: AppColors.brand800, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      children: [
        Card(
          child: SwitchListTile(
            value: profile.available,
            onChanged: _toggling ? null : _setAvailable,
            activeThumbColor: AppColors.brand600,
            contentPadding: const EdgeInsets.fromLTRB(20, 8, 12, 8),
            title: Text('Disponível para atender', style: textTheme.titleMedium),
            subtitle: Text(
              profile.available
                  ? 'Você aparece para os pacientes e pode pegar da fila.'
                  : 'Você não aparece para os pacientes agendarem.',
              style: textTheme.bodySmall,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Dados profissionais', style: textTheme.titleMedium),
                const SizedBox(height: 12),
                _Field(label: 'CRM', value: '${profile.crm}/${profile.crmState}'),
                _Field(label: 'Especialidade', value: profile.specialty),
                if ((profile.subSpecialty ?? '').isNotEmpty)
                  _Field(label: 'Subespecialidade', value: profile.subSpecialty!),
                _Field(
                  label: 'Valor da consulta',
                  value: fee != null ? 'R\$ ${fee.toStringAsFixed(2).replaceAll('.', ',')}' : 'Não definido',
                ),
                _Field(label: 'E-mail', value: _user?.email ?? '', last: true),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Bio, valor e horários são editados no site (painel do médico).',
          style: textTheme.bodySmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: _logout,
          icon: const Icon(Icons.logout, size: 18),
          label: const Text('Sair da conta'),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.danger600,
            side: const BorderSide(color: AppColors.danger500),
          ),
        ),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.value, this.last = false});

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
