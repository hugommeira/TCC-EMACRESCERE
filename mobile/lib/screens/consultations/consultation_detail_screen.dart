import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/consultation.dart';
import '../../services/consultation_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/motion.dart';
import 'chat/chat_screen.dart';

/// Detalhe de uma consulta: prontuário (campos da própria consulta —
/// não existe endpoint de leitura separado no backend) e prescrição.
class ConsultationDetailScreen extends StatefulWidget {
  const ConsultationDetailScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ConsultationDetailScreen> createState() => _ConsultationDetailScreenState();
}

class _ConsultationDetailScreenState extends State<ConsultationDetailScreen> {
  late Future<Consultation> _future;
  bool _downloadingPdf = false;

  @override
  void initState() {
    super.initState();
    _future = ConsultationService.getConsultationDetail(widget.consultationId);
  }

  Future<void> _downloadPdf(String prescriptionId) async {
    if (kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Baixar PDF só funciona no app nativo (Android), não neste preview web.')),
      );
      return;
    }

    setState(() => _downloadingPdf = true);
    try {
      final bytes = await ConsultationService.downloadPrescriptionPdf(prescriptionId);
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/receita-$prescriptionId.pdf');
      await file.writeAsBytes(bytes);
      if (!mounted) return;
      await launchUrl(Uri.file(file.path), mode: LaunchMode.externalApplication);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Não foi possível baixar a prescrição: $e')),
      );
    } finally {
      if (mounted) setState(() => _downloadingPdf = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhe da consulta')),
      body: FutureBuilder<Consultation>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Erro ao carregar consulta: ${snapshot.error}'));
          }

          final consultation = snapshot.data!;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _StatusCard(consultation: consultation),
              const SizedBox(height: 16),
              _SectionCard(
                title: 'Prontuário',
                child: consultation.chiefComplaint == null && consultation.diagnosis == null
                    ? const Text('Ainda não preenchido pelo médico.')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (consultation.chiefComplaint != null)
                            _Field(label: 'Queixa principal', value: consultation.chiefComplaint!),
                          if (consultation.diagnosis != null)
                            _Field(label: 'Diagnóstico', value: consultation.diagnosis!),
                          if (consultation.conduct != null)
                            _Field(label: 'Conduta', value: consultation.conduct!),
                        ],
                      ),
              ),
              const SizedBox(height: 16),
              _SectionCard(
                title: 'Prescrição',
                child: consultation.prescriptionId == null
                    ? const Text('Nenhuma prescrição emitida ainda.')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (consultation.prescriptionStatus == 'ISSUED') ...[
                            const Center(child: Seal3D(size: 110)),
                            const SizedBox(height: 8),
                          ],
                          Text(
                            consultation.prescriptionStatus == 'ISSUED'
                                ? 'Prescrição assinada e disponível.'
                                : 'Prescrição em rascunho — ainda não assinada.',
                          ),
                          if (consultation.prescriptionStatus == 'ISSUED') ...[
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: _downloadingPdf
                                  ? null
                                  : () => _downloadPdf(consultation.prescriptionId!),
                              icon: _downloadingPdf
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.picture_as_pdf_outlined, size: 18),
                              label: Text(_downloadingPdf ? 'Baixando...' : 'Baixar PDF'),
                            ),
                          ],
                        ],
                      ),
              ),
              if (consultation.status.isActive && consultation.roomToken != null) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ChatScreen(roomToken: consultation.roomToken!),
                        ),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('Abrir chat'),
                  ),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.consultation});

  final Consultation consultation;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    consultation.doctor != null
                        ? doctorTitle(consultation.doctor!.name)
                        : 'Consulta',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${consultation.displayDate.day.toString().padLeft(2, '0')}/'
                    '${consultation.displayDate.month.toString().padLeft(2, '0')}/'
                    '${consultation.displayDate.year}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: context.colors.brand500.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                consultation.status.label,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 2),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
