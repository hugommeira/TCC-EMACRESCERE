import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'motion.dart';
import 'ui.dart';

class WelcomeSlide {
  const WelcomeSlide({required this.tag, required this.title, required this.text});

  final String tag;
  final String title;
  final String text;
}

// Os textos só afirmam o que o app faz: consulta com hora marcada e chat
// (vídeo não existe no app), receita assinada pelo médico.
const welcomeSlides = [
  WelcomeSlide(
    tag: 'Peso e IMC',
    title: 'Acompanhe sua evolução, semana a semana',
    text:
        'Registre suas pesagens e veja o gráfico e o IMC atualizados na hora, '
        'com a sua meta sempre à vista.',
  ),
  WelcomeSlide(
    tag: 'Consulta marcada',
    title: 'Seu médico, no horário que você escolher',
    text: 'Agende com hora marcada e converse com o médico pelo chat da consulta.',
  ),
  WelcomeSlide(
    tag: 'Receita digital',
    title: 'Receita assinada, direto no app',
    text:
        'Quando o médico emitir, a receita chega assinada com o certificado '
        'digital dele, pronta para baixar.',
  ),
];

/// Prancheta "1 · Boas-vindas": coração 3D com órbitas, três slides e o
/// botão com brilho. Usada antes do login ([AccessBlockedScreen]) e no
/// onboarding depois do primeiro login ([OnboardingScreen]).
class WelcomeCarousel extends StatefulWidget {
  const WelcomeCarousel({
    super.key,
    required this.lastLabel,
    required this.onDone,
    required this.onSkip,
    this.bottomLinkLabel,
    this.onBottomLink,
    this.busy = false,
    this.extra,
  });

  /// Texto do botão no último slide (antes: "Próximo").
  final String lastLabel;
  final VoidCallback onDone;
  final VoidCallback onSkip;
  final String? bottomLinkLabel;
  final VoidCallback? onBottomLink;
  final bool busy;

  /// Conteúdo extra abaixo do link (ex.: botão de debug).
  final Widget? extra;

  @override
  State<WelcomeCarousel> createState() => _WelcomeCarouselState();
}

class _WelcomeCarouselState extends State<WelcomeCarousel> {
  final _controller = PageController();
  int _page = 0;

  bool get _isLast => _page == welcomeSlides.length - 1;

  void _next() {
    if (_isLast) {
      widget.onDone();
      return;
    }
    _controller.nextPage(duration: const Duration(milliseconds: 420), curve: Curves.easeOutCubic);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return Scaffold(
      backgroundColor: ds.bg,
      body: Stack(
        children: [
          Positioned(left: -40, top: -150, child: DriftBlob(size: 420, color: ds.blobA)),
          Positioned(right: -120, top: 250, child: DriftBlob(size: 300, color: ds.blobB)),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, box) {
                // Em telas baixas o 3D encolhe antes de apertar o texto.
                final hero = (box.maxHeight * 0.45).clamp(200.0, 380.0);
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 18, 20, 0),
                      child: Row(
                        children: [
                          Expanded(child: Text('Emacrescere', style: AppType.title(19, ds.title))),
                          const ThemeToggle(),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: widget.busy ? null : widget.onSkip,
                            style: TextButton.styleFrom(
                              foregroundColor: ds.link,
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                              textStyle: const TextStyle(
                                fontFamily: AppType.sans,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            child: const Text('Pular'),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: hero,
                      child: Center(child: FloatingLogo3D(size: hero * 0.66)),
                    ),
                    Expanded(
                      child: PageView.builder(
                        controller: _controller,
                        itemCount: welcomeSlides.length,
                        onPageChanged: (i) => setState(() => _page = i),
                        itemBuilder: (context, i) => _SlideText(slide: welcomeSlides[i]),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(28, 8, 28, 22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              for (var i = 0; i < welcomeSlides.length; i++)
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 350),
                                  curve: Curves.easeOutCubic,
                                  margin: const EdgeInsets.only(right: 8),
                                  width: i == _page ? 28 : 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: i == _page ? ds.link : ds.dotOff,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 18),
                          ShineButton(
                            label: _isLast ? widget.lastLabel : 'Próximo',
                            onPressed: _next,
                            loading: widget.busy,
                          ),
                          if (widget.bottomLinkLabel != null) ...[
                            const SizedBox(height: 10),
                            Center(
                              child: TextButton(
                                onPressed: widget.onBottomLink,
                                style: TextButton.styleFrom(
                                  foregroundColor: ds.link,
                                  textStyle: const TextStyle(
                                    fontFamily: AppType.sans,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                child: Text(widget.bottomLinkLabel!),
                              ),
                            ),
                          ],
                          ?widget.extra,
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SlideText extends StatelessWidget {
  const _SlideText({required this.slide});

  final WelcomeSlide slide;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: ds.chip, borderRadius: BorderRadius.circular(999)),
            child: Text(
              slide.tag.toUpperCase(),
              style: TextStyle(
                fontFamily: AppType.sans,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.72,
                color: context.colors.isDark ? ds.muted : ds.text,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(slide.title, style: AppType.title(34, ds.title)),
          const SizedBox(height: 12),
          Text(
            slide.text,
            style: TextStyle(fontFamily: AppType.sans, fontSize: 16, height: 1.5, color: ds.body),
          ),
        ],
      ),
    );
  }
}
