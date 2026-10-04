import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../services/onboarding_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/brand_mark.dart';
import '../../widgets/motion.dart';

class _OnboardingSlide {
  const _OnboardingSlide({
    required this.tag,
    required this.title,
    required this.description,
  });

  final String tag;
  final String title;
  final String description;
}

// Os textos só afirmam o que o app faz: consulta com hora marcada e chat
// (vídeo não existe no app), receita assinada pelo médico.
const _slides = [
  _OnboardingSlide(
    tag: 'Peso e IMC',
    title: 'Acompanhe sua evolução, semana a semana',
    description:
        'Registre suas pesagens e veja o gráfico e o IMC atualizados na hora, '
        'com a sua meta sempre à vista.',
  ),
  _OnboardingSlide(
    tag: 'Consulta marcada',
    title: 'Seu médico, no horário que você escolher',
    description: 'Agende com hora marcada e converse com o médico pelo chat da consulta.',
  ),
  _OnboardingSlide(
    tag: 'Receita digital',
    title: 'Receita assinada, direto no app',
    description:
        'Quando o médico emitir, a receita chega assinada com o certificado '
        'digital dele, pronta para baixar.',
  ),
];

/// Mostrada só na primeira vez que o login é bem-sucedido (flag persistida
/// via OnboardingService). Ao terminar, pede permissão de notificação.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onFinished});

  final VoidCallback onFinished;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  bool _finishing = false;

  bool get _isLastSlide => _page == _slides.length - 1;

  Future<void> _next() async {
    if (!_isLastSlide) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
      return;
    }
    await _finish();
  }

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);

    await Permission.notification.request();
    await OnboardingService.markOnboardingSeen();

    if (mounted) widget.onFinished();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colors = context.colors;
    return Scaffold(
      body: Stack(
        children: [
          // Manchas de luz menta ao fundo.
          Positioned(
            left: -60,
            top: -140,
            child: _Glow(size: 420, color: colors.isDark ? AppColors.brand500.withValues(alpha: 0.22) : AppColors.brand200),
          ),
          Positioned(
            right: -130,
            top: 260,
            child: _Glow(size: 300, color: AppColors.teal400.withValues(alpha: colors.isDark ? 0.16 : 0.26)),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 12, 12, 0),
                  child: Row(
                    children: [
                      const BrandTile(size: 36),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Emacrescere',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: colors.ink),
                        ),
                      ),
                      TextButton(
                        onPressed: _finishing ? null : _finish,
                        child: const Text('Pular'),
                      ),
                    ],
                  ),
                ),
                const Expanded(
                  flex: 11,
                  child: Center(child: FloatingLogo3D(size: 210)),
                ),
                Expanded(
                  flex: 9,
                  child: PageView.builder(
                    controller: _controller,
                    itemCount: _slides.length,
                    onPageChanged: (index) => setState(() => _page = index),
                    itemBuilder: (context, index) {
                      final slide = _slides[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 28),
                        child: Rise(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: colors.brand100,
                                  borderRadius: BorderRadius.circular(AppRadius.pill),
                                ),
                                child: Text(
                                  slide.tag.toUpperCase(),
                                  style: textTheme.labelSmall?.copyWith(
                                    color: colors.brand800,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                              Text(
                                slide.title,
                                style: textTheme.headlineMedium?.copyWith(height: 1.12, letterSpacing: -0.4),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                slide.description,
                                style: textTheme.bodyLarge?.copyWith(color: colors.gray700, height: 1.5),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 0),
                  child: Row(
                    children: List.generate(_slides.length, (index) {
                      final active = index == _page;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 350),
                        curve: Curves.easeOutCubic,
                        margin: const EdgeInsets.only(right: 8),
                        width: active ? 28 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: active ? colors.brand700 : colors.brand200,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _finishing ? null : _next,
                      style: ElevatedButton.styleFrom(minimumSize: const Size(0, 56)),
                      child: Text(_isLastSlide ? 'Começar' : 'Próximo'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)]),
        ),
      ),
    );
  }
}
