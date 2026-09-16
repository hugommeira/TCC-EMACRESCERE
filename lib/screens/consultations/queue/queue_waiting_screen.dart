import 'dart:async';

import 'package:flutter/material.dart';

import '../../../services/consultation_service.dart';
import '../../../services/queue_service.dart';
import '../../../theme/app_theme.dart';
import '../room/consultation_room_screen.dart';

/// Paciente na fila (status WAITING): mostra a posição, mantém o
/// heartbeat (POST /api/queue/heartbeat a cada 20s — sem ele o backend
/// considera abandono) e faz polling de GET /api/queue/position. Quando o
/// médico pega o atendimento (IN_PROGRESS) abre a sala da consulta.
///
/// O site usa SSE (/api/realtime/patient/[id]) com polling de fallback;
/// aqui é só polling, igual ao chat — simples e suficiente pra 5s.
class QueueWaitingScreen extends StatefulWidget {
  const QueueWaitingScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<QueueWaitingScreen> createState() => _QueueWaitingScreenState();
}

class _QueueWaitingScreenState extends State<QueueWaitingScreen> {
  Timer? _poll;
  Timer? _heartbeat;
  QueuePosition? _position;
  String? _error;
  bool _leaving = false;

  @override
  void initState() {
    super.initState();
    _refresh();
    _sendHeartbeat();
    _poll = Timer.periodic(const Duration(seconds: 5), (_) => _refresh());
    _heartbeat = Timer.periodic(const Duration(seconds: 20), (_) => _sendHeartbeat());
  }

  @override
  void dispose() {
    _poll?.cancel();
    _heartbeat?.cancel();
    super.dispose();
  }

  Future<void> _sendHeartbeat() async {
    try {
      await QueueService.heartbeat(widget.consultationId);
    } catch (_) {
      // Sem drama: o próximo heartbeat tenta de novo.
    }
  }

  Future<void> _refresh() async {
    try {
      final pos = await QueueService.getPosition(widget.consultationId);
      if (!mounted) return;
      setState(() {
        _position = pos;
        _error = null;
      });
      if (pos.isInProgress) {
        _poll?.cancel();
        _heartbeat?.cancel();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ConsultationRoomScreen(consultationId: widget.consultationId),
          ),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = 'Sem conexão com a fila: $e');
    }
  }

  Future<void> _leave() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da fila?'),
        content: const Text('Você perde a posição e a consulta é cancelada.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Ficar'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sair da fila'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _leaving = true);
    try {
      await ConsultationService.cancelConsultation(widget.consultationId);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _leaving = false;
        _error = 'Não foi possível sair da fila: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final pos = _position;

    Widget body;
    if (pos != null && pos.isOver) {
      body = _Message(
        icon: Icons.info_outline,
        title: 'Consulta encerrada',
        text: pos.status == 'NO_SHOW'
            ? 'A consulta foi marcada como não compareceu.'
            : 'A consulta foi cancelada.',
      );
    } else if (pos != null && pos.isAwaitingPayment) {
      body = const _Message(
        icon: Icons.hourglass_empty,
        title: 'Pagamento ainda não confirmado',
        text: 'Assim que confirmar, você entra na fila automaticamente.',
      );
    } else {
      final ahead = pos?.ahead ?? 0;
      body = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: AppColors.brand500.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: pos == null
                  ? const CircularProgressIndicator()
                  : Text(
                      '${pos.position ?? '–'}',
                      style: textTheme.displaySmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 20),
          Text('Você está na fila', style: textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            pos == null
                ? 'Buscando sua posição…'
                : ahead == 0
                    ? 'Você é o próximo. Um médico vai te atender em instantes.'
                    : '$ahead ${ahead == 1 ? 'pessoa' : 'pessoas'} na sua frente.',
            style: textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(AppRadius.card),
            ),
            child: Row(
              children: [
                const Icon(Icons.phone_android, size: 18, color: AppColors.gray600),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Mantenha esta tela aberta. Quando o médico pegar seu atendimento, a consulta abre sozinha.',
                    style: textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Fila de atendimento')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Expanded(child: body),
              if (_error != null) ...[
                Text(_error!, style: const TextStyle(color: AppColors.danger600)),
                const SizedBox(height: 12),
              ],
              if (pos == null || pos.isWaiting || pos.isAwaitingPayment)
                TextButton(
                  onPressed: _leaving ? null : _leave,
                  style: TextButton.styleFrom(foregroundColor: AppColors.danger600),
                  child: Text(_leaving ? 'Saindo…' : 'Sair da fila'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.title, required this.text});

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 56, color: AppColors.gray400),
        const SizedBox(height: 16),
        Text(title, style: textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(text, style: textTheme.bodyMedium, textAlign: TextAlign.center),
      ],
    );
  }
}
