import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../services/auth_service.dart';

/// Tela de debug — só é usada como home quando kDebugMode (ver main.dart).
/// Serve pra validar rapidamente AuthService.login() e o cookie de sessão
/// contra o backend real, sem precisar da tela de login definitiva.
class DebugLoginTestScreen extends StatefulWidget {
  const DebugLoginTestScreen({super.key});

  @override
  State<DebugLoginTestScreen> createState() => _DebugLoginTestScreenState();
}

class _DebugLoginTestScreenState extends State<DebugLoginTestScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  String? _resultText;

  Future<void> _testLogin() async {
    setState(() {
      _isLoading = true;
      _resultText = null;
    });

    String result;
    try {
      final loginResult = await AuthService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!loginResult.success) {
        result = 'LOGIN FALHOU: erro="${loginResult.errorCode}"';
      } else {
        final buffer = StringBuffer('LOGIN OK.\n\n');

        final baseUrl = ApiClient.baseUrlForDebug;
        final cookiesInfo = await ApiClient.debugCookiesFor(baseUrl);
        buffer.writeln('Cookies salvos após login:');
        buffer.writeln(cookiesInfo);
        buffer.writeln();

        try {
          // Chamada autenticada de verificação: endpoint nativo do NextAuth
          // que devolve a sessão atual com base no cookie enviado. Se vier
          // com "user", o cookie de sessão foi realmente aceito pelo
          // backend — não só que o login respondeu 200/302.
          final dio = await ApiClient.instance;
          final sessionResponse = await dio.get('/api/auth/session');
          final data = sessionResponse.data;
          final hasUser =
              data is Map && data['user'] != null;

          buffer.writeln('Chamada autenticada (GET /api/auth/session):');
          buffer.writeln('Status: ${sessionResponse.statusCode}');
          buffer.writeln('Corpo: $data');
          buffer.writeln();
          buffer.writeln(
            hasUser
                ? 'Cookie de sessão ACEITO — sessão autenticada confirmada.'
                : 'Cookie de sessão NÃO reconhecido — sessão veio vazia.',
          );
        } on DioException catch (e) {
          buffer.writeln('Erro na chamada autenticada: ${e.message}');
          buffer.writeln('Resposta: ${e.response?.data}');
        }
        result = buffer.toString();
      }
    } on DioException catch (e) {
      result =
          'ERRO DE LOGIN (DioException):\n${e.message}\n\nResposta: ${e.response?.data}';
    } catch (e) {
      result = 'ERRO INESPERADO:\n$e';
    }

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _resultText = result;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          result.split('\n').first,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor:
            result.startsWith('LOGIN OK') ? Colors.green : Colors.red,
      ),
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
      appBar: AppBar(title: const Text('DEBUG — Teste de login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            const Text(
              'Tela de debug (kDebugMode only) pra testar login contra o '
              'backend real.',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Senha'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoading ? null : _testLogin,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Testar login'),
            ),
            if (_resultText != null) ...[
              const SizedBox(height: 24),
              SelectableText(_resultText!),
            ],
          ],
        ),
      ),
    );
  }
}
