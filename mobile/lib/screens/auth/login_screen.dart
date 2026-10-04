import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/api_client.dart';
import '../../services/auth_service.dart';
import '../../widgets/brand_mark.dart';
import '../../theme/app_theme.dart';
import 'register_screen.dart';

/// Login nativo do app (NextAuth Credentials via AuthService.login — o
/// mesmo mecanismo já validado em debug_login_test_screen.dart), pra não
/// depender mais de sair do app pro site.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.onLoggedIn});

  /// Chamado depois de um login bem-sucedido — deixa o StartupGate
  /// reavaliar a sessão.
  final VoidCallback onLoggedIn;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await AuthService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      if (result.success) {
        widget.onLoggedIn();
        return;
      }

      setState(() {
        _loading = false;
        _error = result.errorCode == 'CredentialsSignin'
            ? 'E-mail ou senha incorretos.'
            : 'Não foi possível entrar. Tente novamente.';
      });
    } catch (e, st) {
      // Investigando um "Null check operator used on a null value" real
      // (2026-09-16, conta recém-criada) — sem stack trace não dava pra
      // achar a linha exata; isso fica pra sempre, não é só do debug.
      debugPrint('AuthService.login() falhou: $e\n$st');
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Não foi possível conectar ao servidor: $e';
      });
    }
  }

  Future<void> _openForgotPassword() async {
    final siteUrl = ApiClient.siteUrl;
    if (siteUrl.isEmpty) return;
    await launchUrl(Uri.parse('$siteUrl/auth/forgot-password'), mode: LaunchMode.externalApplication);
  }

  void _openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => RegisterScreen(onLoggedIn: widget.onLoggedIn)),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Entrar')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                const Align(alignment: Alignment.centerLeft, child: BrandTile(size: 64)),
                const SizedBox(height: 20),
                Text('Bem-vindo(a) de volta', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 6),
                Text(
                  'Entre com a conta do seu acompanhamento Emacrescere.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 28),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.colors.danger500.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppRadius.card),
                    ),
                    child: Text(_error!, style: TextStyle(color: context.colors.danger600)),
                  ),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'E-mail'),
                  validator: (value) =>
                      (value == null || !value.contains('@')) ? 'Informe um e-mail válido' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Senha'),
                  validator: (value) =>
                      (value == null || value.length < 8) ? 'Mínimo 8 caracteres' : null,
                  onFieldSubmitted: (_) => _submit(),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _openForgotPassword,
                    child: const Text('Esqueci minha senha'),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Entrar'),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: _loading ? null : _openRegister,
                    child: const Text('Não tem conta? Criar conta'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
