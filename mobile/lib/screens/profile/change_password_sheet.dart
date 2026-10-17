import 'package:flutter/material.dart';

import '../../services/api_error.dart';
import '../../services/user_service.dart';
import '../../theme/app_theme.dart';

/// Troca de senha (POST /api/profile/password), para paciente e médico.
/// As regras da senha nova (8+ caracteres, maiúscula, número, não comum) são
/// do servidor, que devolve o erro de cada campo; o app só mostra.
class ChangePasswordSheet extends StatefulWidget {
  const ChangePasswordSheet({super.key});

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const ChangePasswordSheet(),
    );
  }

  @override
  State<ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<ChangePasswordSheet> {
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _show = false;
  bool _saving = false;
  String? _error;
  Map<String, List<String>> _fieldErrors = const {};

  String? _fieldError(String field) {
    final list = _fieldErrors[field];
    return (list == null || list.isEmpty) ? null : list.first;
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
      _fieldErrors = const {};
    });
    try {
      await UserService.changePassword(
        currentPassword: _current.text,
        newPassword: _new.text,
        confirmPassword: _confirm.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      final error = ApiError.from(e, fallback: 'Não foi possível trocar a senha.');
      setState(() {
        _saving = false;
        if (error.code == 'PERFIL_SENHA_ATUAL_INCORRETA') {
          // Marca o campo certo em vez de um aviso solto.
          _fieldErrors = {
            'currentPassword': [error.message],
          };
        } else {
          _fieldErrors = error.fieldErrors;
          _error = error.fieldErrors.isEmpty ? error.message : null;
        }
      });
    }
  }

  @override
  void dispose() {
    _current.dispose();
    _new.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Widget _field(TextEditingController c, String label, String field, {String? helper}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: c,
        obscureText: !_show,
        autocorrect: false,
        enableSuggestions: false,
        decoration: InputDecoration(
          labelText: label,
          helperText: helper,
          helperMaxLines: 2,
          errorText: _fieldError(field),
          errorMaxLines: 3,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Trocar senha', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            _field(_current, 'Senha atual', 'currentPassword'),
            _field(
              _new,
              'Nova senha',
              'newPassword',
              helper: 'Mínimo 8 caracteres, com uma letra maiúscula e um número.',
            ),
            _field(_confirm, 'Confirme a nova senha', 'confirmPassword'),
            CheckboxListTile(
              value: _show,
              onChanged: (v) => setState(() => _show = v ?? false),
              title: const Text('Mostrar senhas'),
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
            ),
            if (_error != null) ...[
              Text(_error!, style: TextStyle(color: context.colors.danger600)),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Salvando...' : 'Trocar senha'),
            ),
          ],
        ),
      ),
    );
  }
}
