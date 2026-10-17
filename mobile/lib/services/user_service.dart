import '../models/user_profile.dart';
import 'api_client.dart';

/// Perfil do usuário logado.
///
/// Leitura: GET /api/users/[id] (o backend só deixa o próprio usuário ver o
/// próprio id). Edição: PATCH /api/profile (app/api/profile/route.ts) — nome e
/// telefone para todos; para o paciente, também saúde, altura, meta e contato
/// de emergência. Texto vazio ("") apaga o campo; a validação é do servidor
/// (lib/validations/profile.ts), que devolve os erros por campo.
class UserService {
  UserService._();

  static Future<UserProfile> getProfile(String userId) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/users/$userId');
    return UserProfile.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  /// Manda só os campos de [fields] (nomes iguais aos do servidor). A resposta
  /// não traz e-mail nem papel: a tela recarrega com [getProfile].
  static Future<void> updateProfile(Map<String, Object?> fields) async {
    final dio = await ApiClient.instance;
    await dio.patch('/api/profile', data: fields);
  }

  /// POST /api/profile/password. Erros do servidor: PERFIL_SENHA_ATUAL_INCORRETA
  /// (422), PERFIL_SEM_SENHA (409, conta só Google) e os de campo (senha fraca,
  /// confirmação diferente).
  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final dio = await ApiClient.instance;
    await dio.post(
      '/api/profile/password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
  }
}
