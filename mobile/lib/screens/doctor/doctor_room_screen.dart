import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/consultation.dart';
import '../../services/api_client.dart';
import '../../services/consultation_service.dart';
import '../../services/doctor_service.dart';
import '../../theme/app_theme.dart';
import '../consultations/chat/chat_screen.dart';
import 'patient_weight_sheet.dart';
import 'prontuario_sheet.dart';

/// Sala de atendimento do MÉDICO: dados do paciente + queixa, chat pelo
/// roomToken e ações — prontuário (PATCH .../prontuario), receita (no
/// site, que tem o certificado ICP-Brasil) e encerrar (POST .../end).
class DoctorRoomScreen extends StatefulWidget {
  const DoctorRoomScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<DoctorRoomScreen> createState() => _DoctorRoomScreenState();
}

class _DoctorRoomScreenState extends State<DoctorRoomScreen> {
  late Future<Consultation> _future;
  bool _ending = false;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    _future = ConsultationService.getConsultationDetail(widget.consultationId);
  }

  void _reload() {
    setState(() { _future = ConsultationService.getConsultationDetail(widget.consultationId); });
  }

  Future<void> _openProntuario(Consultation c) async {
    final saved = await ProntuarioSheet.show(context, c);
    if (saved == true) _reload();
  }

  Future<void> _openPrescriptionOnSite() async {
    final site = ApiClient.siteUrl;
    if (site.isEmpty) return;
    await launchUrl(
      Uri.parse('$site/dashboard/doctor/consultations/${widget.consultationId}'),
      mode: LaunchMode.externalApplication,
    );
  }

  /// Consulta agendada (SCHEDULED/WAITING): o médico inicia daqui. Antes o
  /// app só sabia atender pela fila; consulta marcada abria a tela de
  /// detalhe do paciente, sem como iniciar.
  Future<void> _start() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Iniciar atendimento?'),
        content: const Text('A consulta passa a "em andamento" e o paciente é avisado pra entrar.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Voltar')),
          FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Iniciar')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _starting = true);
    try {
      await DoctorService.startConsultation(widget.consultationId);
      if (mounted) {
        setState(() => _starting = false);
        _reload();
      }
    } on DoctorFailure catch (e) {
      if (!mounted) return;
      setState(() => _starting = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _end() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Encerrar consulta?'),
        content: const Text('O paciente será avisado e o chat fica só como histórico.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Voltar')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: context.colors.danger600),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Encerrar'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _ending = true);
    try {
      await DoctorService.endConsultation(widget.consultationId);
      if (mounted) Navigator.of(context).pop(true);
    } on DoctorFailure catch (e) {
      if (!mounted) return;
      setState(() => _ending = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Consultation>(
      future: _future,
      builder: (context, snapshot) {
        final c = snapshot.data;
        final inProgress = c?.status == ConsultationStatus.inProgress;

        Widget body;
        if (snapshot.connectionState == ConnectionState.waiting) {
          body = const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError || c == null) {
          body = Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Não foi possível abrir a consulta: ${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: _reload, child: const Text('Tentar de novo')),
                ],
              ),
            ),
          );
        } else {
          body = Column(
            children: [
              _PatientBanner(consultation: c, onProntuario: () => _openProntuario(c)),
              Expanded(
                child: c.roomToken != null
                    ? ChatScreen(roomToken: c.roomToken!, embedded: true)
                    : const Center(child: Text('Esta consulta não tem sala de chat.')),
              ),
            ],
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(c?.patient?.name ?? 'Atendimento', style: const TextStyle(fontSize: 17)),
                if (c != null)
                  Text(c.status.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
              ],
            ),
            actions: [
              if (c != null && c.patient != null)
                IconButton(
                  tooltip: 'Evolução de peso',
                  onPressed: () => PatientWeightSheet.show(
                    context,
                    patientId: c.patient!.id,
                    patientName: c.patient!.name,
                    consultationId: c.id,
                  ),
                  icon: const Icon(Icons.monitor_weight_outlined),
                ),
              if (c != null)
                IconButton(
                  tooltip: 'Receita (no site)',
                  onPressed: _openPrescriptionOnSite,
                  icon: const Icon(Icons.description_outlined),
                ),
              if (c != null &&
                  (c.status == ConsultationStatus.scheduled || c.status == ConsultationStatus.waiting))
                TextButton(
                  onPressed: _starting ? null : _start,
                  child: Text(_starting ? 'Iniciando…' : 'Iniciar'),
                ),
              if (inProgress)
                TextButton(
                  onPressed: _ending ? null : _end,
                  style: TextButton.styleFrom(foregroundColor: context.colors.danger600),
                  child: Text(_ending ? 'Encerrando…' : 'Encerrar'),
                ),
            ],
          ),
          body: body,
        );
      },
    );
  }
}

class _PatientBanner extends StatelessWidget {
  const _PatientBanner({required this.consultation, required this.onProntuario});

  final Consultation consultation;
  final VoidCallback onProntuario;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final complaint = consultation.chiefComplaint;
    final hasProntuario = (consultation.diagnosis ?? '').isNotEmpty || (consultation.conduct ?? '').isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: context.colors.card,
        border: Border(bottom: BorderSide(color: context.colors.brand100)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (complaint != null && complaint.isNotEmpty) ...[
            Text('Queixa do paciente', style: textTheme.labelMedium),
            const SizedBox(height: 2),
            Text(complaint, style: textTheme.bodyMedium, maxLines: 3, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 10),
          ],
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onProntuario,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 40),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                  ),
                  icon: Icon(hasProntuario ? Icons.edit_note_rounded : Icons.note_add_outlined, size: 18),
                  label: Text(hasProntuario ? 'Editar prontuário' : 'Prontuário'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
