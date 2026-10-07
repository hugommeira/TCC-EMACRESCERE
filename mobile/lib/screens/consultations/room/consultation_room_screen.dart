import 'package:flutter/material.dart';

import '../../../models/consultation.dart';
import '../../../services/consultation_service.dart';
import '../../../utils/formatters.dart';
import '../../../widgets/video_call_panel.dart';
import '../chat/chat_screen.dart';

/// Sala da consulta em andamento (IN_PROGRESS): videochamada (LiveKit, a
/// mesma sala do site, [VideoCallPanel]) em cima do chat com o médico pelo
/// roomToken da consulta.
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
              VideoCallPanel(consultationId: consultation.id, otherLabel: 'o médico'),
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
