import '../models/chat_message.dart';
import 'api_client.dart';

/// Quem pode mandar mensagem e até quando, como o servidor decidiu
/// (`access` de GET .../messages; regra única em lib/chat-access.ts do site).
/// O app não refaz a conta das 24 h: só mostra.
class ChatAccess {
  const ChatAccess({required this.canSend, this.sendUntil, required this.reason});

  final bool canSend;

  /// Fim do prazo depois da consulta (só na janela de 24 h).
  final DateTime? sendUntil;

  /// ATIVA | POS_CONSULTA | ENCERRADO | NAO_INICIADA | CANCELADA
  final String reason;

  /// Código do catálogo para o aviso da caixa trancada (o mesmo que o
  /// servidor devolve ao recusar um envio, `chatBlockedCode`).
  String get blockedCode => switch (reason) {
    'ENCERRADO' => 'CHAT_ENCERRADO',
    'CANCELADA' => 'CONSULTA_ENCERRADA',
    _ => 'CHAT_FORA_DA_CONSULTA',
  };

  static ChatAccess? fromJson(Object? json) {
    if (json is! Map) return null;
    final until = json['sendUntil'];
    return ChatAccess(
      canSend: json['canSend'] == true,
      sendUntil: until is String ? DateTime.tryParse(until) : null,
      reason: json['reason'] is String ? json['reason'] as String : '',
    );
  }
}

/// Mensagens da consulta e o acesso ao envio.
class ChatThread {
  const ChatThread({required this.messages, this.access});

  final List<ChatMessage> messages;

  /// Nulo se o servidor não mandar (versão antiga): o app então só reage ao
  /// erro do envio.
  final ChatAccess? access;
}

/// Chat real de uma consulta, identificado pelo roomToken (campo da
/// Consultation). Contrato confirmado lendo app/api/chat/[roomToken]/*.
///
/// Sem SSE por simplicidade — a tela de chat atualiza via polling (pull to
/// refresh + timer). O backend expõe GET .../stream (SSE) se quisermos
/// trocar por tempo real depois.
class ChatService {
  ChatService._();

  static Future<ChatThread> getThread(String roomToken) async {
    final dio = await ApiClient.instance;
    final response = await dio.get('/api/chat/$roomToken/messages');
    return ChatThread(
      messages: (response.data['data'] as List)
          .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
      access: ChatAccess.fromJson(response.data['access']),
    );
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
