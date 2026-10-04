import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/consultation.dart';
import '../../services/consultation_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../services/api_client.dart';
import '../../widgets/motion.dart';
import '../../widgets/ui.dart';
import 'chat/chat_screen.dart';

/// Prancheta "5 · Consulta e receita": abas Resumo (prontuário — campos da
/// própria consulta, não há endpoint de leitura separado), Receita (selo 3D,
/// PDF e validação pública) e Chat.
class ConsultationDetailScreen extends StatefulWidget {
  const ConsultationDetailScreen({super.key, required this.consultationId});

  final String consultationId;

  @override
  State<ConsultationDetailScreen> createState() => _ConsultationDetailScreenState();
}

class _ConsultationDetailScreenState extends State<ConsultationDetailScreen> {
  late Future<Consultation> _future;
  bool _downloadingPdf = false;

  /// Aba aberta: null = ainda não escolhida (abre na Receita quando há receita
  /// assinada, senão no Resumo).
  String? _tab;

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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Não foi possível baixar a prescrição: $e')));
    } finally {
      if (mounted) setState(() => _downloadingPdf = false);
    }
  }

  /// Página pública de validação, o mesmo link impresso no PDF
  /// (services/api/prescription.ts: `/prescricao/<id>`).
  Future<void> _openValidation(String prescriptionId) async {
    final url = Uri.parse('${ApiClient.siteUrl}/prescricao/$prescriptionId');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Scaffold(
      backgroundColor: ds.bg,
      body: SafeArea(
        child: FutureBuilder<Consultation>(
          future: _future,
          builder: (context, snapshot) {
            final c = snapshot.data;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Header(consultation: c),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Expanded(child: Center(child: CircularProgressIndicator()))
                else if (snapshot.hasError || c == null)
                  Expanded(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'Erro ao carregar consulta: ${snapshot.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: ds.text),
                        ),
                      ),
                    ),
                  )
                else
                  ..._content(c),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Widget> _content(Consultation c) {
    final issued = c.prescriptionStatus == 'ISSUED';
    final hasChat = c.roomToken != null;
    final tab = _tab ?? (issued ? 'receita' : 'resumo');
    return [
      Padding(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
        child: PillSegmented<String>(
          brand: true,
          height: 42,
          trackColor: context.ds.card,
          options: [
            const PillOption('resumo', 'Resumo'),
            const PillOption('receita', 'Receita'),
            if (hasChat) const PillOption('chat', 'Chat'),
          ],
          value: tab,
          onChanged: (t) => setState(() => _tab = t),
        ),
      ),
      const SizedBox(height: 14),
      Expanded(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 280),
          child: KeyedSubtree(
            key: ValueKey(tab),
            child: switch (tab) {
              'chat' when hasChat => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: ChatScreen(roomToken: c.roomToken!, embedded: true),
              ),
              'receita' => _ReceiptTab(
                consultation: c,
                downloading: _downloadingPdf,
                onDownload: () => _downloadPdf(c.prescriptionId!),
                onValidate: () => _openValidation(c.prescriptionId!),
              ),
              _ => _SummaryTab(consultation: c),
            },
          ),
        ),
      ),
    ];
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.consultation});

  final Consultation? consultation;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final c = consultation;
    final when = c?.displayDate.toLocal();
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 18, 18, 0),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).maybePop(),
            tooltip: 'Voltar',
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: ds.text, size: 20),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c == null
                      ? 'Consulta'
                      : doctorTitle(c.doctor?.name).isEmpty
                      ? 'Consulta'
                      : doctorTitle(c.doctor?.name),
                  style: AppType.title(22, ds.title, height: 1.2),
                  overflow: TextOverflow.ellipsis,
                ),
                if (c != null && when != null)
                  Text(
                    '${c.displayLabel} · ${formatDate(when)} às ${formatTime(when)}',
                    style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
                  ),
              ],
            ),
          ),
          const ThemeToggle(),
        ],
      ),
    );
  }
}

class _SummaryTab extends StatelessWidget {
  const _SummaryTab({required this.consultation});

  final Consultation consultation;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final c = consultation;
    Widget field(String label, String? value, {String empty = 'Ainda não registrado pelo médico.'}) => Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: AppType.eyebrow(ds.link, size: 12).copyWith(letterSpacing: 0.72)),
          const SizedBox(height: 4),
          Text(
            (value ?? '').trim().isEmpty ? empty : value!.trim(),
            style: TextStyle(
              fontFamily: AppType.sans,
              height: 1.5,
              color: (value ?? '').trim().isEmpty ? ds.muted : ds.body,
            ),
          ),
        ],
      ),
    );
    return ListView(
      padding: EdgeInsets.fromLTRB(18, 0, 18, 24 + MediaQuery.paddingOf(context).bottom),
      children: [
        Rise(
          child: DsCard(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                field('Motivo', c.chiefComplaint, empty: 'Não informado.'),
                field('Diagnóstico', c.diagnosis),
                field('Orientações do médico', c.conduct),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ReceiptTab extends StatelessWidget {
  const _ReceiptTab({
    required this.consultation,
    required this.downloading,
    required this.onDownload,
    required this.onValidate,
  });

  final Consultation consultation;
  final bool downloading;
  final VoidCallback onDownload;
  final VoidCallback onValidate;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final c = consultation;
    final issued = c.prescriptionStatus == 'ISSUED';
    final hasPrescription = c.prescriptionId != null;
    final doctor = doctorTitle(c.doctor?.name);

    final title = issued
        ? 'Receita assinada'
        : hasPrescription
        ? 'Receita em preparação'
        : 'Nenhuma receita';
    final text = issued
        ? 'Emitida por ${doctor.isEmpty ? 'seu médico' : doctor} e assinada com o certificado digital do médico.'
        : hasPrescription
        ? 'O médico ainda não assinou esta receita. Quando assinar, ela aparece aqui.'
        : 'Quando o médico emitir uma receita nesta consulta, ela aparece aqui.';

    return ListView(
      padding: EdgeInsets.fromLTRB(18, 0, 18, 24 + MediaQuery.paddingOf(context).bottom),
      children: [
        Rise(
          child: DsCard(
            radius: 28,
            gradient: ds.receiptHero,
            padding: const EdgeInsets.fromLTRB(18, 22, 18, 20),
            child: Column(
              children: [
                Opacity(
                  opacity: issued ? 1 : 0.45,
                  child: SizedBox(
                    width: 170,
                    height: 170,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        const Seal3D(size: 136),
                        if (issued) ...const [
                          Positioned(top: 18, right: 22, child: _Sparkle(size: 10, color: Color(0xFFC7EFA6))),
                          Positioned(
                            bottom: 26,
                            left: 16,
                            child: _Sparkle(size: 7, color: AppColors.brand300, delay: 0.35),
                          ),
                          Positioned(top: 60, left: 6, child: _Sparkle(size: 6, color: Colors.white, delay: 0.65)),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(title, style: AppType.title(24, Colors.white, height: 1.2)),
                const SizedBox(height: 10),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 280),
                  child: Text(
                    text,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: AppType.sans,
                      fontSize: 14,
                      height: 1.45,
                      color: Color(0xFFD1FAE5),
                    ),
                  ),
                ),
                if (issued) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _HeroButton(
                          icon: Icons.download_rounded,
                          label: downloading ? 'Baixando...' : 'Baixar PDF',
                          filled: true,
                          onTap: downloading ? null : onDownload,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _HeroButton(icon: Icons.verified_user_outlined, label: 'Validar', onTap: onValidate),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
        if (hasPrescription) ...[
          const SizedBox(height: 14),
          Rise(
            delay: const Duration(milliseconds: 80),
            child: DsCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _InfoRow(
                    label: 'Emitida em',
                    value: c.prescriptionIssuedAt == null ? 'Ainda não assinada' : formatDate(c.prescriptionIssuedAt!),
                  ),
                  Divider(height: 24, color: ds.tint),
                  _InfoRow(label: 'Nº da receita', value: '#${_shortId(c.prescriptionId!)}'),
                  Divider(height: 24, color: ds.tint),
                  Text(
                    'Qualquer pessoa confere a autenticidade pelo link de validação impresso '
                    'na receita: a página do site compara a assinatura com o PDF.',
                    style: TextStyle(fontFamily: AppType.sans, fontSize: 13, height: 1.45, color: ds.muted),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// O mesmo número curto do PDF (lib/prescription-pdf.ts: últimos 12 do id).
  static String _shortId(String id) => (id.length > 12 ? id.substring(id.length - 12) : id).toUpperCase();
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontFamily: AppType.sans,
            fontWeight: FontWeight.w600,
            color: ds.title,
            letterSpacing: 0.5,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}

class _HeroButton extends StatelessWidget {
  const _HeroButton({required this.icon, required this.label, required this.onTap, this.filled = false});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final fg = filled ? AppColors.brand900 : Colors.white;
    return PressScale(
      child: Material(
        color: filled ? Colors.white : Colors.transparent,
        shape: StadiumBorder(side: filled ? BorderSide.none : const BorderSide(color: Color(0x99D1FAE5), width: 1.5)),
        child: InkWell(
          onTap: onTap,
          customBorder: const StadiumBorder(),
          child: SizedBox(
            height: 50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: fg, size: 20),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w600, fontSize: 15, color: fg),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Faísca que acende e apaga em volta do selo.
class _Sparkle extends StatefulWidget {
  const _Sparkle({required this.size, required this.color, this.delay = 0});

  final double size;
  final Color color;
  final double delay;

  @override
  State<_Sparkle> createState() => _SparkleState();
}

class _SparkleState extends State<_Sparkle> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (reduceMotion(context)) {
      _c.value = 0.5;
      _c.stop();
    } else if (!_c.isAnimating) {
      _c.repeat();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = (_c.value + widget.delay) % 1.0;
        final k = 1 - (2 * t - 1).abs(); // 0 → 1 → 0
        return Opacity(
          opacity: k,
          child: Transform.scale(
            scale: 0.3 + 0.7 * k,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color,
                boxShadow: [BoxShadow(color: widget.color, blurRadius: 12)],
              ),
            ),
          ),
        );
      },
    );
  }
}
