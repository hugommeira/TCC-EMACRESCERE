import 'dart:async';

import 'package:flutter/material.dart';

import '../../../errors/error_catalog.dart';
import '../../../models/chat_message.dart';
import '../../../services/chat_service.dart';
import '../../../theme/app_theme.dart';
import '../../../services/api_error.dart';
import '../../../utils/formatters.dart';

/// Chat real de uma consulta (roomToken vem do backend). Atualiza via
/// polling — o backend também expõe SSE em .../stream, dá pra trocar
/// depois se quisermos tempo real de verdade.
///
/// Envio: durante a consulta e por 24 h depois dela; leitura sempre. Quem
/// decide é o servidor (`access` do GET): a caixa tranca quando `canSend` é
/// falso e mostra o prazo quando há `sendUntil`.
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.roomToken, this.title, this.embedded = false});

  final String roomToken;

  /// Título da AppBar (ex.: nome do médico). Default "Chat".
  final String? title;

  /// Sem Scaffold/AppBar próprios — pra encaixar dentro de outra tela
  /// (sala da consulta).
  final bool embedded;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

/// Recusas de envio do servidor que fecham a caixa (lib/chat-access.ts).
const _closingCodes = {'CHAT_ENCERRADO', 'CONSULTA_ENCERRADA', 'CHAT_FORA_DA_CONSULTA'};

class _ChatScreenState extends State<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  List<ChatMessage> _messages = [];
  ChatAccess? _access;

  /// Código do catálogo quando um envio foi recusado (409) antes de o GET
  /// seguinte trazer o `access` novo.
  String? _blockedCode;
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _init();
    _pollTimer = Timer.periodic(const Duration(seconds: 5), (_) => _load(silent: true));
  }

  Future<void> _init() async {
    await _load();
    // Marcar como lido é detalhe: se o servidor recusar (só paciente ou
    // médico da consulta podem), o chat continua normal.
    try {
      await ChatService.markRead(widget.roomToken);
    } catch (_) {}
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final thread = await ChatService.getThread(widget.roomToken);
      if (!mounted) return;
      setState(() {
        _messages = thread.messages;
        if (thread.access != null) {
          _access = thread.access;
          _blockedCode = thread.access!.canSend ? null : thread.access!.blockedCode;
        }
        _loading = false;
        _error = null;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = silent ? _error : 'Não foi possível carregar o chat. ${errorMessage(e)}';
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
    });
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;

    setState(() => _sending = true);
    try {
      await ChatService.sendMessage(widget.roomToken, text);
      _controller.clear();
      await _load(silent: true);
    } catch (e) {
      if (!mounted) return;
      final error = ApiError.from(e);
      if (_closingCodes.contains(error.code)) {
        // O prazo acabou enquanto a tela estava aberta: tranca a caixa. O
        // texto fica guardado no campo e o histórico continua visível.
        setState(() => _blockedCode = error.code);
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Não foi possível enviar. ${error.message}')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final content = Column(
      children: [
        Expanded(child: _buildBody()),
        if (_blockedCode != null)
          _ClosedNotice(message: messageForCode(_blockedCode!))
        else ...[
          if (_access?.sendUntil != null) _DeadlineNotice(until: _access!.sendUntil!),
          _Composer(controller: _controller, sending: _sending, onSend: _send),
        ],
      ],
    );
    if (widget.embedded) return content;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title ?? 'Chat')),
      body: content,
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              ElevatedButton(onPressed: _load, child: const Text('Tentar de novo')),
            ],
          ),
        ),
      );
    }
    if (_messages.isEmpty) {
      return const Center(child: Text('Nenhuma mensagem ainda. Diga oi!'));
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isMine = message.sender.role == 'PATIENT';
        return _MessageBubble(message: message, isMine: isMine);
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.isMine});

  final ChatMessage message;
  final bool isMine;

  @override
  Widget build(BuildContext context) {
    final bgColor = isMine ? AppColors.brand600 : context.colors.card;
    final textColor = isMine ? Colors.white : context.colors.gray900;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMine ? 16 : 4),
            bottomRight: Radius.circular(isMine ? 4 : 16),
          ),
          border: isMine ? null : Border.all(color: context.colors.gray200),
        ),
        child: Text(message.content, style: TextStyle(color: textColor)),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.sending, required this.onSend});

  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => onSend(),
                decoration: const InputDecoration(hintText: 'Digite uma mensagem...'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: sending ? null : onSend,
              icon: sending
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send),
            ),
          ],
        ),
      ),
    );
  }
}

/// Faixa acima da caixa na janela de 24 h depois da consulta.
class _DeadlineNotice extends StatelessWidget {
  const _DeadlineNotice({required this.until});

  final DateTime until;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: [
          Icon(Icons.schedule_rounded, size: 16, color: context.colors.gray600),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'Você pode mandar mensagens até ${formatDate(until)} às ${formatTime(until)}.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: context.colors.gray600),
            ),
          ),
        ],
      ),
    );
  }
}

/// No lugar da caixa quando o envio está fechado: a mensagem do catálogo e o
/// lembrete de que o histórico continua aqui.
class _ClosedNotice extends StatelessWidget {
  const _ClosedNotice({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return SafeArea(
      top: false,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: context.colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: context.colors.gray200),
        ),
        child: Row(
          children: [
            Icon(Icons.lock_outline_rounded, size: 18, color: context.colors.gray600),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message, style: textTheme.bodyMedium),
                  const SizedBox(height: 2),
                  Text(
                    'As mensagens antigas continuam aqui.',
                    style: textTheme.bodySmall?.copyWith(color: context.colors.gray600),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
