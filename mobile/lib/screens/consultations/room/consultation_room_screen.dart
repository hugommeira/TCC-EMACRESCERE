import 'package:flutter/material.dart';

import '../../../models/consultation.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/formatters.dart';
import '../chat/chat_screen.dart';

/// Sala da consulta em andamento (IN_PROGRESS): chat real com o médico
/// pelo roomToken da consulta. Videochamada (LiveKit, /api/livekit/token)
/// ainda não está no app — o banner deixa isso claro em vez de fingir.
///
/// Substitui a antiga sala simulada (new_consultation/), que não batia
/// no backend.
class ConsultationRoomScreen extends StatefulWidget {
  const ConsultationRoomScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ConsultationRoomScreen> createState() => _ConsultationRoomScreenState();
}

class _ConsultationRoomScreenState extends State<ConsultationRoomScreen> {
  late Future<Consultation> _future;

  @override
  void initState() {
    super.initState();
    _future = ConsultationService.getConsultationDetail(widget.consultationId);
  }

  void _reload() {
    setState(() { _future = ConsultationService.getConsultationDetail(widget.consultationId); });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Consultation>(
      future: _future,
      builder: (context, snapshot) {
        final consultation = snapshot.data;
        final doctor = consultation?.doctor;
        final title = doctor != null ? doctorTitle(doctor.name) : 'Consulta';

        Widget body;
        if (snapshot.connectionState == ConnectionState.waiting) {
          body = const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError || consultation == null) {
          body = Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Não foi possível abrir a consulta: ${snapshot.error}',
                      textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: _reload, child: const Text('Tentar de novo')),
                ],
              ),
            ),
          );
        } else if (consultation.roomToken == null) {
          body = const Center(child: Text('Esta consulta ainda não tem sala de chat.'));
        } else {
          body = Column(
            children: [
              const _VideoSoonBanner(),
              Expanded(
                child: ChatScreen(roomToken: consultation.roomToken!, embedded: true),
              ),
            ],
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 17)),
                if (consultation != null)
                  Text(
                    consultation.displayLabel,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
                  ),
              ],
            ),
          ),
          body: body,
        );
      },
    );
  }
}

class _VideoSoonBanner extends StatelessWidget {
  const _VideoSoonBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: context.colors.brand500.withValues(alpha: 0.12),
      child: Row(
        children: [
          Icon(Icons.videocam_off_outlined, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Videochamada em breve no app — por enquanto o atendimento é pelo chat.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}
