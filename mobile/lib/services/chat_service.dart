import '../models/chat_message.dart';
import 'api_client.dart';

/// Chat real de uma consulta, identificado pelo roomToken (campo da
/// Consultation). Contrato confirmado lendo app/api/chat/[roomToken]/*.
///
/// Sem SSE por simplicidade — a tela de chat atualiza via polling (pull to
/// refresh + timer). O backend expõe GET .../stream (SSE) se quisermos
/// trocar por tempo real depois.
class ChatService {
  ChatService._();

  static Future<List<ChatMessage>> getMessages(String roomToken) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/chat/$roomToken/messages');
    return (response.data['data'] as List)
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<ChatMessage> sendMessage(String roomToken, String content) async {
    final dio = await ApiClient.instance;
    final response = await dio.post(
      '/api/chat/$roomToken/messages',
      data: {'content': content, 'type': 'TEXT'},
    );
    return ChatMessage.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  static Future<void> markRead(String roomToken) async {
    final dio = await ApiClient.instance;
    await dio.post('/api/chat/$roomToken/read');
  }
}
