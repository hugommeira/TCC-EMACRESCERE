import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../services/api_client.dart';
import '../services/api_error.dart';
import '../theme/app_theme.dart';

/// Foto de perfil.
///
/// A foto enviada no site/app vem como caminho relativo
/// (`/api/avatar/{userId}?v=...`) e **exige o cookie de sessão**: é baixada
/// pelo próprio [ApiClient] (no celular o cookie_jar manda o cookie; na web
/// o pedido é da mesma origem). Foto do Google vem como URL completa e
/// pública: vai direto pelo [NetworkImage].
class UserAvatar extends StatefulWidget {
  const UserAvatar({super.key, required this.url, this.size = 48, this.placeholder});

  final String? url;
  final double size;

  /// O que aparece sem foto (ou enquanto carrega/falha).
  final Widget? placeholder;

  /// Cache por URL: o `?v=` muda a cada troca de foto, então não fica velho.
  static final Map<String, Uint8List> _cache = {};

  @override
  State<UserAvatar> createState() => _UserAvatarState();
}

class _UserAvatarState extends State<UserAvatar> {
  Uint8List? _bytes;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  @override
  void didUpdateWidget(UserAvatar old) {
    super.didUpdateWidget(old);
    if (old.url != widget.url) {
      _bytes = null;
      _fetch();
    }
  }

  bool get _isRelative => (widget.url ?? '').startsWith('/');

  Future<void> _fetch() async {
    final url = widget.url;
    if (url == null || !_isRelative) return;
    final cached = UserAvatar._cache[url];
    if (cached != null) {
      setState(() => _bytes = cached);
      return;
    }
    try {
      final dio = await ApiClient.instance;
      final res = await dio.get<List<int>>(url, options: Options(responseType: ResponseType.bytes));
      final bytes = Uint8List.fromList(res.data ?? const []);
      if (bytes.isEmpty) return;
      UserAvatar._cache[url] = bytes;
      if (mounted && widget.url == url) setState(() => _bytes = bytes);
    } catch (_) {
      // Sem foto: fica o placeholder.
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = widget.url;
    final ImageProvider? image = _bytes != null
        ? MemoryImage(_bytes!)
        : (url != null && url.startsWith('http'))
        ? NetworkImage(url)
        : null;
    final fallback =
        widget.placeholder ??
        Icon(Icons.person_rounded, size: widget.size * 0.55, color: context.colors.brand600);
    return ClipOval(
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: image == null
            ? Center(child: fallback)
            : Image(
                image: image,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Center(child: fallback),
              ),
      ),
    );
  }
}

/// Trocar ou remover a foto (POST / DELETE /api/profile/avatar). O
/// servidor aceita JPG, PNG ou WebP até 2 MB; a foto é reduzida no aparelho
/// antes de enviar. Devolve o novo `avatarUrl` (ou null ao remover), ou
/// [AvatarSheet.unchanged] se a pessoa desistiu.
class AvatarSheet {
  AvatarSheet._();

  static const unchanged = '__sem_mudanca__';

  static Future<String?> show(BuildContext context, {required bool hasPhoto}) async {
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Tirar foto'),
              onTap: () => Navigator.of(ctx).pop('camera'),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Escolher da galeria'),
              onTap: () => Navigator.of(ctx).pop('gallery'),
            ),
            if (hasPhoto)
              ListTile(
                leading: Icon(Icons.delete_outline_rounded, color: ctx.colors.danger600),
                title: Text('Remover foto', style: TextStyle(color: ctx.colors.danger600)),
                onTap: () => Navigator.of(ctx).pop('remove'),
              ),
          ],
        ),
      ),
    );
    if (choice == null || !context.mounted) return unchanged;

    try {
      final dio = await ApiClient.instance;
      if (choice == 'remove') {
        await dio.delete('/api/profile/avatar');
        return null;
      }
      if (choice == 'camera' && !kIsWeb) {
        // O app declara CAMERA (videochamada): com isso o Android exige a
        // permissão concedida antes de abrir a câmera pelo image_picker.
        final status = await Permission.camera.request();
        if (!status.isGranted) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Sem permissão de câmera. Libere nas configurações do aparelho.'),
              ),
            );
          }
          return unchanged;
        }
      }
      final picked = await ImagePicker().pickImage(
        source: choice == 'camera' ? ImageSource.camera : ImageSource.gallery,
        // Reduz no aparelho: foto de perfil não precisa de mais que isso, e
        // fica bem abaixo dos 2 MB do servidor.
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 82,
      );
      if (picked == null) return unchanged;
      final bytes = await picked.readAsBytes();
      final res = await dio.post(
        '/api/profile/avatar',
        data: FormData.fromMap({'file': MultipartFile.fromBytes(bytes, filename: picked.name)}),
      );
      return (res.data['data'] as Map)['avatarUrl'] as String?;
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage(e, fallback: 'Não foi possível trocar a foto.'))),
        );
      }
      return unchanged;
    }
  }
}
