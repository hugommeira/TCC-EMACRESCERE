import 'package:dio/dio.dart';

import 'api_client.dart';

/// Autentica contra o fluxo padrão do NextAuth v5 (Credentials provider),
/// via cookie de sessão — o mesmo mecanismo usado pelo site web.
///
/// O contrato (endpoints, campos, status codes) foi inferido lendo
/// lib/auth.ts e lib/auth.config.ts do backend, não testado contra o
/// servidor real ainda. Validar assim que houver ambiente de teste.
class AuthService {
  AuthService._();

  static Future<({bool success, String? errorCode})> login({
    required String email,
    required String password,
  }) async {
    final dio = await ApiClient.instance;

    final csrfResponse = await dio.get('/api/auth/csrf');
    final csrfToken = csrfResponse.data['csrfToken'] as String;

    final loginResponse = await dio.post(
      '/api/auth/callback/credentials',
      data: {
        'csrfToken': csrfToken,
        'email': email,
        'password': password,
        'json': 'true',
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
        followRedirects: false,
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    // NextAuth responde 302 tanto em sucesso quanto em falha — a diferença
    // é o destino do redirect. Em falha, o "location" aponta de volta pra
    // /auth/login com "?error=...". Em sucesso, aponta pro callbackUrl sem
    // esse parâmetro.
    final location = loginResponse.headers.value('location') ?? '';
    final errorCode = Uri.tryParse(location)?.queryParameters['error'];

    final statusOk =
        loginResponse.statusCode == 200 || loginResponse.statusCode == 302;
    final success = statusOk && errorCode == null;

    return (success: success, errorCode: success ? null : errorCode);
  }

  static Future<void> logout() async {
    await ApiClient.clearSession();
  }
}
