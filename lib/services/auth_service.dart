import 'package:dio/dio.dart';

import 'api_client.dart';

/// Usuário da sessão atual, devolvido por AuthService.checkSession().
class SessionUser {
  const SessionUser({required this.name, required this.email, required this.role});

  final String? name;
  final String? email;
  final String? role;
}

/// Autentica contra o fluxo padrão do NextAuth v5 (Credentials provider),
/// via cookie de sessão — o mesmo mecanismo usado pelo site web.
///
/// Login e checagem de sessão validados contra o backend real (conta de
/// paciente do seed).
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

  /// Verifica se já existe uma sessão válida (cookie persistido de um
  /// login anterior). Usado na checagem de sessão ao abrir o app.
  static Future<SessionUser?> checkSession() async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.get('/api/auth/session');
      final data = response.data;
      if (data is! Map || data['user'] == null) return null;

      final user = data['user'] as Map;
      return SessionUser(
        name: user['name'] as String?,
        email: user['email'] as String?,
        role: user['role'] as String?,
      );
    } on DioException {
      return null;
    }
  }

  static Future<void> logout() async {
    await ApiClient.clearSession();
  }
}
