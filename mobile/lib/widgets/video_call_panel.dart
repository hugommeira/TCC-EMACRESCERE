import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';

import '../constants.dart';
import '../services/video_service.dart';
import '../theme/app_theme.dart';

enum _Phase { idle, connecting, connected }

/// Videochamada da consulta, em cima do chat nas salas da paciente e do
/// médico. Mesma sala LiveKit do site, então uma ponta pode estar no app e a
/// outra no site.
///
/// Só conecta quando a pessoa toca em "Entrar no vídeo": a câmera não liga
/// sozinha ao abrir a sala, e no Safari do iPhone o som da outra pessoa só
/// toca depois de um toque na página.
class VideoCallPanel extends StatefulWidget {
  const VideoCallPanel({super.key, required this.consultationId, required this.otherLabel});

  final String consultationId;

  /// Quem está do outro lado ("o médico", "a paciente"...), para o texto de
  /// espera.
  final String otherLabel;

  @override
  State<VideoCallPanel> createState() => _VideoCallPanelState();
}

class _VideoCallPanelState extends State<VideoCallPanel> {
  _Phase _phase = _Phase.idle;
  Room? _room;
  EventsListener<RoomEvent>? _listener;
  String? _error;
  bool _frontCamera = true;
  bool _busy = false;

  @override
  void dispose() {
    _leave(updateUi: false);
    super.dispose();
  }

  Future<void> _join() async {
    if (kDemoApi) {
      setState(() => _error = 'O vídeo não funciona no modo demonstração.');
      return;
    }
    setState(() {
      _phase = _Phase.connecting;
      _error = null;
    });

    final room = Room(
      roomOptions: const RoomOptions(
        adaptiveStream: true,
        dynacast: true,
        defaultCameraCaptureOptions: CameraCaptureOptions(
          cameraPosition: CameraPosition.front,
          params: VideoParametersPresets.h540_169,
        ),
      ),
    );
    try {
      final access = await VideoService.getAccess(widget.consultationId);
      final listener = room.createListener();
      listener.listen((_) {
        if (mounted) setState(() {});
      });
      listener.on<RoomDisconnectedEvent>((_) {
        if (mounted && _room == room) _leave();
      });
      _listener = listener;
      _room = room;

      await room.connect(access.url, access.token);
      if (!mounted) return;
      setState(() => _phase = _Phase.connected);

      // Microfone e câmera separados: sem permissão de um, o outro ainda
      // entra, e a pessoa continua ouvindo/vendo quem está do outro lado.
      final problems = <String>[];
      try {
        await room.localParticipant?.setMicrophoneEnabled(true);
      } catch (_) {
        problems.add('microfone');
      }
      try {
        await room.localParticipant?.setCameraEnabled(true);
      } catch (_) {
        problems.add('câmera');
      }
      if (problems.isNotEmpty && mounted) {
        _snack(
          'Não deu para ligar ${problems.join(' e ')}. Confira a permissão nas '
          'configurações do aparelho ou do navegador.',
        );
      }
      if (mounted) setState(() {});
    } on VideoFailure catch (e) {
      await _dispose(room);
      if (!mounted) return;
      setState(() {
        _phase = _Phase.idle;
        _error = e.message;
      });
    } catch (_) {
      await _dispose(room);
      if (!mounted) return;
      setState(() {
        _phase = _Phase.idle;
        _error = 'Não foi possível conectar ao vídeo. Confira a internet e tente de novo.';
      });
    }
  }

  Future<void> _dispose(Room room) async {
    if (_room == room) {
      _room = null;
      await _listener?.dispose();
      _listener = null;
    }
    try {
      await room.disconnect();
    } catch (_) {}
    await room.dispose();
  }

  Future<void> _leave({bool updateUi = true}) async {
    final room = _room;
    if (room == null) return;
    if (updateUi && mounted) setState(() => _phase = _Phase.idle);
    await _dispose(room);
  }

  Future<void> _toggleMic() => _run(() async {
    final p = _room?.localParticipant;
    if (p == null) return;
    await p.setMicrophoneEnabled(!p.isMicrophoneEnabled());
  });

  Future<void> _toggleCamera() => _run(() async {
    final p = _room?.localParticipant;
    if (p == null) return;
    await p.setCameraEnabled(!p.isCameraEnabled());
  });

  Future<void> _flipCamera() => _run(() async {
    final track = _localVideo();
    if (track == null) return;
    final next = _frontCamera ? CameraPosition.back : CameraPosition.front;
    await track.setCameraPosition(next);
    _frontCamera = !_frontCamera;
  });

  Future<void> _run(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } catch (_) {
      _snack('Não foi possível mudar agora. Tente de novo.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String text) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(content: Text(text)));
  }

  LocalVideoTrack? _localVideo() {
    for (final pub in _room?.localParticipant?.videoTrackPublications ?? const []) {
      final track = pub.track;
      if (pub.source == TrackSource.camera && track is LocalVideoTrack && !pub.muted) {
        return track;
      }
    }
    return null;
  }

  RemoteParticipant? _remote() {
    final all = _room?.remoteParticipants.values;
    return (all == null || all.isEmpty) ? null : all.first;
  }

  VideoTrack? _remoteVideo(RemoteParticipant? p) {
    for (final pub in p?.videoTrackPublications ?? const <RemoteTrackPublication>[]) {
      final track = pub.track;
      if (pub.source == TrackSource.camera &&
          pub.subscribed &&
          !pub.muted &&
          track is RemoteVideoTrack) {
        return track;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return switch (_phase) {
      _Phase.idle => _IdleBar(error: _error, onJoin: _join),
      _Phase.connecting => const _Stage(
        child: _StageMessage(text: 'Conectando ao vídeo…', spinner: true),
      ),
      _Phase.connected => _buildCall(context),
    };
  }

  Widget _buildCall(BuildContext context) {
    final remote = _remote();
    final remoteVideo = _remoteVideo(remote);
    final localVideo = _localVideo();
    final local = _room?.localParticipant;
    final micOn = local?.isMicrophoneEnabled() ?? false;
    final camOn = local?.isCameraEnabled() ?? false;

    return _Stage(
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (remoteVideo != null)
            VideoTrackRenderer(remoteVideo, fit: VideoViewFit.cover)
          else
            _StageMessage(
              text: remote == null
                  ? 'Aguardando ${widget.otherLabel} entrar no vídeo…'
                  : '${remote.name.isEmpty ? 'A outra pessoa' : remote.name} está com a câmera desligada.',
            ),
          if (localVideo != null)
            Positioned(
              top: 10,
              right: 10,
              width: 86,
              height: 116,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: ColoredBox(
                  color: Colors.black,
                  child: VideoTrackRenderer(
                    localVideo,
                    fit: VideoViewFit.cover,
                    mirrorMode: _frontCamera ? VideoViewMirrorMode.mirror : VideoViewMirrorMode.off,
                  ),
                ),
              ),
            ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 10,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _RoundButton(
                  icon: micOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                  tooltip: micOn ? 'Desligar microfone' : 'Ligar microfone',
                  active: micOn,
                  onTap: _busy ? null : _toggleMic,
                ),
                _RoundButton(
                  icon: camOn ? Icons.videocam_rounded : Icons.videocam_off_rounded,
                  tooltip: camOn ? 'Desligar câmera' : 'Ligar câmera',
                  active: camOn,
                  onTap: _busy ? null : _toggleCamera,
                ),
                // Na web o navegador escolhe a câmera; virar fica só no celular.
                if (!kIsWeb && camOn)
                  _RoundButton(
                    icon: Icons.cameraswitch_rounded,
                    tooltip: 'Virar a câmera',
                    active: true,
                    onTap: _busy ? null : _flipCamera,
                  ),
                _RoundButton(
                  icon: Icons.call_end_rounded,
                  tooltip: 'Sair do vídeo',
                  danger: true,
                  onTap: () => _leave(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Faixa fechada: o chat fica com a tela toda até a pessoa entrar no vídeo.
class _IdleBar extends StatelessWidget {
  const _IdleBar({required this.error, required this.onJoin});

  final String? error;
  final VoidCallback onJoin;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 10, 12, 10),
      color: context.colors.brand500.withValues(alpha: 0.12),
      child: Row(
        children: [
          Icon(Icons.videocam_outlined, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              error ?? 'Videochamada da consulta',
              style: error != null
                  ? textTheme.bodySmall?.copyWith(color: context.colors.danger600)
                  : textTheme.bodyMedium,
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: onJoin,
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 40),
              padding: const EdgeInsets.symmetric(horizontal: 14),
            ),
            child: Text(error != null ? 'Tentar de novo' : 'Entrar no vídeo'),
          ),
        ],
      ),
    );
  }
}

/// Área escura do vídeo: até 40% da altura da tela, para o chat continuar
/// à vista embaixo.
class _Stage extends StatelessWidget {
  const _Stage({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final height = (MediaQuery.sizeOf(context).height * 0.4).clamp(220.0, 420.0);
    return SizedBox(
      width: double.infinity,
      height: height,
      child: ColoredBox(color: const Color(0xFF0B1F18), child: child),
    );
  }
}

class _StageMessage extends StatelessWidget {
  const _StageMessage({required this.text, this.spinner = false});

  final String text;
  final bool spinner;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 72),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (spinner) ...[
              const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white70),
              ),
              const SizedBox(height: 12),
            ],
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.active = false,
    this.danger = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;
  final bool active;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final bg = danger
        ? const Color(0xFFDC2626)
        : active
        ? Colors.white.withValues(alpha: 0.18)
        : Colors.white;
    final fg = danger || active ? Colors.white : const Color(0xFF0B1F18);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      child: Tooltip(
        message: tooltip,
        child: Material(
          color: bg,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: SizedBox(width: 48, height: 48, child: Icon(icon, color: fg, size: 22)),
          ),
        ),
      ),
    );
  }
}
