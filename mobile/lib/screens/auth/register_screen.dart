import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_mark.dart';
import 'credential_check_dialog.dart';

/// Valida dígitos verificadores do CPF — espelha a mesma checagem do
/// backend (lib/validations/auth.ts) pra dar feedback imediato antes do
/// round-trip.
bool _isValidCpf(String raw) {
  final cpf = raw.replaceAll(RegExp(r'\D'), '');
  if (cpf.length != 11) return false;
  if (RegExp(r'^(\d)\1{10}$').hasMatch(cpf)) return false;

  int calcDigit(int length) {
    var sum = 0;
    for (var i = 0; i < length; i++) {
      sum += int.parse(cpf[i]) * (length + 1 - i);
    }
    final digit = 11 - (sum % 11);
    return digit >= 10 ? 0 : digit;
  }

  return calcDigit(9) == int.parse(cpf[9]) && calcDigit(10) == int.parse(cpf[10]);
}

const _ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

enum _AccountType { patient, doctor }

/// Cadastro (POST /api/users/register) — mesmos campos e regras do
/// registerSchema / registerDoctorSchema do backend.
///
/// Médico informa CRM/UF/especialidade e passa pela verificação de
/// credenciamento (simulada, ver CredentialCheckDialog); a conta nasce
/// pendente e o StartupGate mostra a tela de "aguardando aprovação".
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.onLoggedIn});

  final VoidCallback onLoggedIn;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _cpfController = TextEditingController();
  final _phoneController = TextEditingController();
  final _crmController = TextEditingController();
  final _specialtyController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  _AccountType _type = _AccountType.patient;
  String? _crmState;
  bool _loading = false;
  bool _acceptedTerms = false;
  String? _error;

  Future<void> _openSitePage(String path) async {
    final site = ApiClient.siteUrl;
    if (site.isEmpty) return;
    await launchUrl(Uri.parse('$site$path'), mode: LaunchMode.externalApplication);
  }

  bool get _isDoctor => _type == _AccountType.doctor;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isDoctor && _crmState == null) {
      setState(() => _error = 'Selecione a UF do CRM.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final RegisterFailure? failure;
    if (_isDoctor) {
      final crm = _crmController.text.replaceAll(RegExp(r'\D'), '');
      failure = await CredentialCheckDialog.run(
        context,
        crm: crm,
        crmState: _crmState!,
        submit: () => AuthService.registerDoctor(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          cpf: _cpfController.text.replaceAll(RegExp(r'\D'), ''),
          phone: _phoneController.text.replaceAll(RegExp(r'\D'), ''),
          crm: crm,
          crmState: _crmState!,
          specialty: _specialtyController.text.trim(),
          password: _passwordController.text,
          confirmPassword: _confirmController.text,
        ),
      );
    } else {
      failure = await AuthService.register(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        cpf: _cpfController.text.replaceAll(RegExp(r'\D'), ''),
        phone: _phoneController.text.replaceAll(RegExp(r'\D'), ''),
        password: _passwordController.text,
        confirmPassword: _confirmController.text,
      );
    }

    if (!mounted) return;

    if (failure != null) {
      final details = failure.fieldErrors?.values.expand((e) => e).join(' ');
      setState(() {
        _loading = false;
        _error = details != null && details.isNotEmpty ? details : failure!.message;
      });
      return;
    }

    // Cadastro não estabelece sessão — loga em seguida com as mesmas
    // credenciais. Médico cai na tela de "aguardando aprovação".
    try {
      final loginResult = await AuthService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (loginResult.success) {
        widget.onLoggedIn();
        return;
      }
    } catch (e, st) {
      debugPrint('AuthService.login() (pós-cadastro) falhou: $e\n$st');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Conta criada, mas não foi possível conectar pra fazer login: $e';
      });
      return;
    }

    setState(() {
      _loading = false;
      _error = 'Conta criada! Volte e faça login com o e-mail e senha cadastrados.';
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _cpfController.dispose();
    _phoneController.dispose();
    _crmController.dispose();
    _specialtyController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Criar conta')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Align(alignment: Alignment.centerLeft, child: BrandTile(size: 56)),
                const SizedBox(height: 16),
                Text('Quem é você?', style: textTheme.titleMedium),
                const SizedBox(height: 8),
                SegmentedButton<_AccountType>(
                  segments: const [
                    ButtonSegment(
                      value: _AccountType.patient,
                      label: Text('Paciente'),
                      icon: Icon(Icons.person_outline_rounded),
                    ),
                    ButtonSegment(
                      value: _AccountType.doctor,
                      label: Text('Médico(a)'),
                      icon: Icon(Icons.medical_services_outlined),
                    ),
                  ],
                  selected: {_type},
                  onSelectionChanged: _loading
                      ? null
                      : (value) => setState(() {
                            _type = value.first;
                            _error = null;
                          }),
                  style: ButtonStyle(
                    visualDensity: VisualDensity.comfortable,
                    backgroundColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected) ? AppColors.brand100 : Colors.white,
                    ),
                    foregroundColor: WidgetStateProperty.all(AppColors.ink),
                    side: WidgetStateProperty.all(const BorderSide(color: AppColors.brand200)),
                  ),
                ),
                if (_isDoctor) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradientSoft,
                      borderRadius: BorderRadius.circular(AppRadius.card),
                      border: Border.all(color: AppColors.brand100),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified_outlined, color: AppColors.brand700, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Seu CRM passa por verificação e o cadastro é analisado pela equipe '
                            'Emacrescere antes de você começar a atender.',
                            style: textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.danger500.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppRadius.card),
                    ),
                    child: Text(_error!, style: const TextStyle(color: AppColors.danger600)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Nome completo'),
                  validator: (value) =>
                      (value == null || value.trim().length < 2) ? 'Nome muito curto' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'E-mail'),
                  validator: (value) =>
                      (value == null || !value.contains('@')) ? 'Informe um e-mail válido' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _cpfController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'CPF', hintText: 'Somente números'),
                  validator: (value) =>
                      (value == null || !_isValidCpf(value)) ? 'CPF inválido' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Telefone (opcional)'),
                ),
                if (_isDoctor) ...[
                  const SizedBox(height: 24),
                  Text('Dados profissionais', style: textTheme.titleMedium),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: _crmController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'CRM', hintText: 'Só números'),
                          validator: (value) {
                            if (!_isDoctor) return null;
                            final digits = (value ?? '').replaceAll(RegExp(r'\D'), '');
                            return RegExp(r'^\d{4,7}$').hasMatch(digits) ? null : '4 a 7 dígitos';
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<String>(
                          initialValue: _crmState,
                          decoration: const InputDecoration(labelText: 'UF'),
                          items: [
                            for (final uf in _ufs) DropdownMenuItem(value: uf, child: Text(uf)),
                          ],
                          onChanged: (value) => setState(() => _crmState = value),
                          validator: (value) => (_isDoctor && value == null) ? 'UF' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _specialtyController,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Especialidade',
                      hintText: 'Ex: Endocrinologia, Nutrologia, Clínica Geral',
                    ),
                    validator: (value) =>
                        (_isDoctor && (value == null || value.trim().length < 3)) ? 'Informe a especialidade' : null,
                  ),
                ],
                const SizedBox(height: 24),
                Text('Acesso', style: textTheme.titleMedium),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Senha'),
                  validator: (value) {
                    if (value == null || value.length < 8) return 'Mínimo 8 caracteres';
                    if (!RegExp(r'[A-Z]').hasMatch(value)) return 'Inclua uma letra maiúscula';
                    if (!RegExp(r'[0-9]').hasMatch(value)) return 'Inclua um número';
                    return null;
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirmController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirmar senha'),
                  validator: (value) =>
                      value != _passwordController.text ? 'Senhas não conferem' : null,
                ),
                const SizedBox(height: 16),
                // O backend exige acceptedTerms=true (registerSchema do site).
                CheckboxListTile(
                  value: _acceptedTerms,
                  onChanged: _loading ? null : (value) => setState(() => _acceptedTerms = value ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  activeColor: AppColors.brand600,
                  title: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text('Li e aceito os ', style: textTheme.bodyMedium),
                      _LinkText('Termos de Uso', onTap: () => _openSitePage('/termos')),
                      Text(' e a ', style: textTheme.bodyMedium),
                      _LinkText('Política de Privacidade', onTap: () => _openSitePage('/privacidade')),
                      Text('.', style: textTheme.bodyMedium),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _loading || !_acceptedTerms ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(_isDoctor ? 'Verificar e enviar cadastro' : 'Criar conta'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LinkText extends StatelessWidget {
  const _LinkText(this.text, {required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.brand700,
              fontWeight: FontWeight.w700,
              decoration: TextDecoration.underline,
            ),
      ),
    );
  }
}
