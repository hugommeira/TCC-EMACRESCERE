import '../models/user_profile.dart';
import 'api_client.dart';

/// Perfil do paciente logado — GET/PATCH /api/users/[id]. O backend só
/// deixa o próprio usuário ver/editar o próprio id (403 caso contrário).
class UserService {
  UserService._();

  static Future<UserProfile> getProfile(String userId) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/users/$userId');
    return UserProfile.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  static Future<UserProfile> updateProfile(
    String userId, {
    DateTime? birthDate,
    String? gender,
    String? bloodType,
    List<String>? allergies,
    List<String>? medications,
    String? notes,
  }) async {
    final dio = await ApiClient.instance;
    final response = await dio.patch(
      '/api/users/$userId',
      data: {
        if (birthDate != null) 'birthDate': birthDate.toIso8601String(),
        if (gender != null) 'gender': gender,
        if (bloodType != null) 'bloodType': bloodType,
        if (allergies != null) 'allergies': allergies,
        if (medications != null) 'medications': medications,
        if (notes != null) 'notes': notes,
      },
    );
    return UserProfile.fromJson(response.data['data'] as Map<String, dynamic>);
  }
}
