import 'package:flutter/material.dart';

import '../../models/doctor_profile.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_mark.dart';
import '../startup/startup_gate.dart';

/// Médico logado cujo credenciamento ainda não foi aprovado (ou foi
/// reprovado) pelo admin no site. Não tem acesso à fila até aprovar.
class DoctorPendingScreen extends StatefulWidget {
  const DoctorPendingScreen({super.key, required this.profile, required this.onRetry});

  /// Nulo quando nem o perfil carregou (sem rede).
  final DoctorProfile? profile;
  final Future<void> Function() onRetry;

  @override
  State<DoctorPendingScreen> createState() => _DoctorPendingScreenState();
}

class _DoctorPendingScreenState extends State<DoctorPendingScreen> {
  bool _checking = false;

  Future<void> _retry() async {
    setState(() => _checking = true);
    await widget.onRetry();
    if (mounted) setState(() => _checking = false);
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (!mounted) return;
    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const StartupGate()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final profile = widget.profile;
    final rejected = profile?.isRejected ?? false;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const BrandLockup(tileSize: 72),
              const SizedBox(height: 32),
              Container(
                width: 88,
                height: 88,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: rejected
                      ? context.colors.danger500.withValues(alpha: 0.12)
                      : context.colors.warning500.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  rejected ? Icons.block_rounded : Icons.hourglass_top_rounded,
                  size: 40,
                  color: rejected ? context.colors.danger600 : context.colors.warningFg,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                rejected ? 'Cadastro não aprovado' : 'Credenciamento em análise',
                style: textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                rejected
                    ? 'A equipe Emacrescere não aprovou seu cadastro.'
                    : 'Seu CRM foi verificado e o cadastro está com a equipe Emacrescere. '
                        'Você poderá atender assim que for aprovado.',
                style: textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              if (profile != null) ...[
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Row(label: 'CRM', value: '${profile.crm}/${profile.crmState}'),
                        _Row(label: 'Especialidade', value: profile.specialty),
                        _Row(
                          label: 'Verificação do CRM',
                          value: switch (profile.crmSituation) {
                            'ATIVO' => 'Registro ativo (simulada)',
                            'SUSPENSO' => 'Registro suspenso (simulada)',
                            'NAO_ENCONTRADO' => 'Não encontrado (simulada)',
                            _ => 'Não realizada',
                          },
                        ),
                        if (rejected && (profile.approvalNote ?? '').isNotEmpty)
                          _Row(label: 'Motivo', value: profile.approvalNote!, last: true)
                        else
                          const _Row(label: 'Situação', value: 'Aguardando decisão do admin', last: true),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 28),
              if (!rejected)
                ElevatedButton.icon(
                  onPressed: _checking ? null : _retry,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: Text(_checking ? 'Verificando…' : 'Verificar novamente'),
                ),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: _logout, child: const Text('Sair da conta')),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.last = false});

  final String label;
  final String value;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: last ? 0 : 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
