import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../services/onboarding_service.dart';
import '../../theme/app_theme.dart';

class _OnboardingSlide {
  const _OnboardingSlide({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;
}

const _slides = [
  _OnboardingSlide(
    icon: Icons.monitor_weight_outlined,
    title: 'Acompanhe seu peso',
    description:
        'Registre seu progresso e acompanhe sua evolução ao longo do '
        'tratamento.',
  ),
  _OnboardingSlide(
    icon: Icons.video_call_outlined,
    title: 'Fale com seu médico',
    description: 'Consultas por chat, áudio ou vídeo, direto no app.',
  ),
  _OnboardingSlide(
    icon: Icons.description_outlined,
    title: 'Prescrição digital',
    description: 'Veja e baixe suas prescrições assinadas digitalmente.',
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
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: _finishing ? null : _finish,
                child: const Text('Pular'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (index) => setState(() => _page = index),
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(slide.icon, size: 96, color: AppColors.brand600),
                        const SizedBox(height: 32),
                        Text(
                          slide.title,
                          style: Theme.of(context).textTheme.headlineSmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide.description,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (index) {
                final active = index == _page;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 20 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active ? AppColors.brand600 : AppColors.ink200,
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _finishing ? null : _next,
                  child: Text(_isLastSlide ? 'Começar' : 'Próximo'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
