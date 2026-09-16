import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'api_client.dart';

/// Usuário da sessão atual, devolvido por AuthService.checkSession().
class SessionUser {
  const SessionUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.image,
  });

  final String? id;
  final String? name;
  final String? email;
  final String? role;
  final String? image;
}

/// Erro de cadastro devolvido pelo backend — mensagem geral e/ou erros por
/// campo (formato do zod: { message, errors: { campo: [msgs] } }).
class RegisterFailure {
  const RegisterFailure({required this.message, this.fieldErrors});

  final String message;
  final Map<String, List<String>>? fieldErrors;
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

    final loginRequest = dio.post(
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

    if (kIsWeb) {
      // No navegador o XHR segue o 302 sozinho e não expõe o header
      // "location", então não dá pra ler o "?error=" do redirect. O cookie
      // de sessão já foi gravado na resposta 302 (ou não, em falha) — o que
      // decide é a checagem de sessão logo em seguida.
      try {
        await loginRequest;
      } on DioException {
        // O redirect seguido pode cair numa página que o proxy de dev não
        // serve; irrelevante, o cookie já foi processado pelo navegador.
      }
      final session = await checkSession();
      return (
        success: session != null,
        errorCode: session == null ? 'CredentialsSignin' : null,
      );
    }

    final loginResponse = await loginRequest;

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
        id: user['id'] as String?,
        name: user['name'] as String?,
        email: user['email'] as String?,
        role: user['role'] as String?,
        image: user['image'] as String?,
      );
    } on DioException {
      return null;
    }
  }

  /// Cadastro de paciente (POST /api/users/register). Não estabelece sessão
  /// — o backend só cria a conta; é preciso chamar login() em seguida com as
  /// mesmas credenciais.
  static Future<RegisterFailure?> register({
    required String name,
    required String email,
    required String cpf,
    String? phone,
    required String password,
    required String confirmPassword,
  }) =>
      _register({
        'name': name,
        'email': email,
        'cpf': cpf,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'password': password,
        'confirmPassword': confirmPassword,
        'acceptedTerms': true,
      });

  /// Cadastro de MÉDICO (mesma rota, com role "DOCTOR" + dados do CRM). O
  /// backend verifica o CRM (simulado) — CRM inexistente/suspenso volta 422
  /// com a mensagem em `message` — e cria a conta como PENDING: dá pra
  /// logar, mas só atende depois que o admin aprova no site.
  static Future<RegisterFailure?> registerDoctor({
    required String name,
    required String email,
    required String cpf,
    String? phone,
    required String crm,
    required String crmState,
    required String specialty,
    required String password,
    required String confirmPassword,
  }) =>
      _register({
        'role': 'DOCTOR',
        'name': name,
        'email': email,
        'cpf': cpf,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'crm': crm,
        'crmState': crmState,
        'specialty': specialty,
        'password': password,
        'confirmPassword': confirmPassword,
        'acceptedTerms': true,
      });

  static Future<RegisterFailure?> _register(Map<String, dynamic> body) async {
    final dio = await ApiClient.instance;
    try {
      await dio.post('/api/users/register', data: body);
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = (data is Map ? data['message'] as String? : null) ??
          'Não foi possível concluir o cadastro.';
      final rawErrors = data is Map ? data['errors'] : null;
      final fieldErrors = rawErrors is Map
          ? rawErrors.map(
              (key, value) => MapEntry(
                key.toString(),
                (value as List).map((e) => e.toString()).toList(),
              ),
            )
          : null;
      return RegisterFailure(message: message, fieldErrors: fieldErrors);
    }
  }

  /// Encerra a sessão no servidor (POST /api/auth/signout do NextAuth, que
  /// responde com Set-Cookie expirando o cookie) e limpa o jar local. Só
  /// limpar o jar não bastava: na web o cookie é HttpOnly e fica no
  /// navegador — sem o signout o usuário continuava logado.
  static Future<void> logout() async {
    final dio = await ApiClient.instance;
    try {
      final csrfResponse = await dio.get('/api/auth/csrf');
      final csrfToken = csrfResponse.data['csrfToken'] as String;
      await dio.post(
        '/api/auth/signout',
        data: {'csrfToken': csrfToken, 'json': 'true'},
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          followRedirects: false,
          validateStatus: (status) => status != null && status < 500,
        ),
      );
    } on DioException {
      // Sem rede: ainda assim descarta a sessão local abaixo.
    }
    await ApiClient.clearSession();
  }
}
