import 'package:dio/dio.dart';

import 'api_client.dart';

/// Endereço do LiveKit e a chave (JWT) para entrar na sala da consulta.
class VideoAccess {
  const VideoAccess({required this.url, required this.token});

  final String url;
  final String token;
}

/// Erro com mensagem legível vinda do backend (403 quem não participa da
/// consulta, 409 consulta que não está em andamento, 429 limite de pedidos).
class VideoFailure implements Exception {
  const VideoFailure(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

/// Videochamada da consulta. Contrato confirmado em
/// app/api/livekit/token/route.ts: GET ?consultationId=... -> { token, url,
/// roomName }, só para o paciente e o médico da consulta, e só com ela
/// IN_PROGRESS. A sala é a mesma do site (`consultation_<id>`), então uma
/// ponta no app e a outra no site se encontram.
class VideoService {
  VideoService._();

  static Future<VideoAccess> getAccess(String consultationId) async {
    final dio = await ApiClient.instance;
    try {
      final response = await dio.get(
        '/api/livekit/token',
        queryParameters: {'consultationId': consultationId},
      );
      final data = response.data as Map<String, dynamic>;
      return VideoAccess(url: data['url'] as String, token: data['token'] as String);
    } on DioException catch (e) {
      final data = e.response?.data;
      final message = data is Map && data['message'] is String
          ? data['message'] as String
          : 'Não foi possível conectar ao vídeo.';
      throw VideoFailure(message, statusCode: e.response?.statusCode);
    }
  }
}
