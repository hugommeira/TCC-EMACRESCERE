class ChatSender {
  const ChatSender({required this.id, required this.name, this.role});

  final String id;
  final String name;
  final String? role;

  factory ChatSender.fromJson(Map<String, dynamic> json) => ChatSender(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        role: json['role'] as String?,
      );
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.content,
    required this.type,
    required this.sender,
    required this.createdAt,
    this.readAt,
  });

  final String id;
  final String content;

  /// TEXT | IMAGE | FILE | SYSTEM
  final String type;
  final ChatSender sender;
  final DateTime createdAt;
  final DateTime? readAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        content: json['content'] as String,
        type: json['type'] as String? ?? 'TEXT',
        sender: ChatSender.fromJson(json['sender'] as Map<String, dynamic>),
        createdAt: DateTime.parse(json['createdAt'] as String),
        readAt: json['readAt'] != null ? DateTime.parse(json['readAt'] as String) : null,
      );
}
