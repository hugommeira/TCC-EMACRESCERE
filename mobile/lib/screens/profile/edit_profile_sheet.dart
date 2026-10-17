import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/api_error.dart';
import '../../services/user_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';

// As mesmas listas do site (lib/validations/profile.ts).
const _bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const _genders = ['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'];

/// Bottom sheet de edição do perfil (PATCH /api/profile). Todos editam nome e
/// telefone; o paciente também edita saúde, altura, meta e contato de
/// emergência. Campo apagado vai como "" e o servidor apaga o valor. A
/// validação (limites, formato do telefone...) é do servidor, que devolve o
/// erro de cada campo; o app só mostra.
class EditProfileSheet extends StatefulWidget {
  const EditProfileSheet({super.key, required this.profile});

  final UserProfile profile;

  static Future<bool?> show(BuildContext context, UserProfile profile) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => EditProfileSheet(profile: profile),
    );
  }

  @override
  State<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<EditProfileSheet> {
  UserProfile get _p => widget.profile;
  bool get _patient => !_p.isDoctor;

  late final _name = TextEditingController(text: _p.name);
  late final _phone = TextEditingController(text: _p.phone ?? '');
  late DateTime? _birthDate = _p.birthDate;
  late String? _gender = (_p.gender ?? '').isEmpty ? null : _p.gender;
  late String? _bloodType = _bloodTypes.contains(_p.bloodType) ? _p.bloodType : null;
  late final _allergies = TextEditingController(text: _p.allergies.join(', '));
  late final _medications = TextEditingController(text: _p.medications.join(', '));
  late final _notes = TextEditingController(text: _p.notes ?? '');
  late final _height = TextEditingController(text: _p.heightCm?.toString() ?? '');
  late final _goal = TextEditingController(
    text: _p.goalWeightKg != null ? formatDecimal(_p.goalWeightKg!) : '',
  );
  late final _emergencyName = TextEditingController(text: _p.emergencyContactName ?? '');
  late final _emergencyPhone = TextEditingController(text: _p.emergencyContactPhone ?? '');
  late final _emergencyRelation = TextEditingController(text: _p.emergencyContactRelation ?? '');

  bool _saving = false;
  String? _error;
  Map<String, List<String>> _fieldErrors = const {};

  List<String> _splitList(String value) =>
      value.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

  String? _fieldError(String field) {
    final list = _fieldErrors[field];
    return (list == null || list.isEmpty) ? null : list.first;
  }

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate == null
          ? DateTime(now.year - 30)
          : DateTime(_birthDate!.year, _birthDate!.month, _birthDate!.day),
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  /// "aaaa-mm-dd": o servidor converte para meia-noite de Brasília (como o
  /// formulário do site), sem o app mexer em fuso.
  String _isoDay(DateTime d) {
    // A data que veio do servidor é meia-noite de Brasília (03:00 UTC): o dia
    // certo está nos componentes UTC. A escolhida no calendário é local.
    final day = d.isUtc ? d : DateTime.utc(d.year, d.month, d.day);
    return '${day.year.toString().padLeft(4, '0')}-'
        '${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
  }

  Map<String, Object?> _payload() {
    final fields = <String, Object?>{'name': _name.text.trim(), 'phone': _phone.text.trim()};
    if (_patient) {
      final goal = _goal.text.trim().replaceAll(',', '.');
      fields.addAll({
        'birthDate': _birthDate == null ? '' : _isoDay(_birthDate!),
        'gender': _gender ?? '',
        'bloodType': _bloodType ?? '',
        'allergies': _splitList(_allergies.text),
        'medications': _splitList(_medications.text),
        'notes': _notes.text.trim(),
        // Número quando dá para ler; senão o texto vai como está e o servidor
        // responde com a mensagem do campo.
        'heightCm': int.tryParse(_height.text.trim()) ?? _height.text.trim(),
        'goalWeightKg': double.tryParse(goal) ?? goal,
        'emergencyContactName': _emergencyName.text.trim(),
        'emergencyContactPhone': _emergencyPhone.text.trim(),
        'emergencyContactRelation': _emergencyRelation.text.trim(),
      });
    }
    return fields;
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
      _fieldErrors = const {};
    });
    try {
      await UserService.updateProfile(_payload());
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      final error = ApiError.from(e, fallback: 'Não foi possível salvar o perfil.');
      setState(() {
        _saving = false;
        _fieldErrors = error.fieldErrors;
        _error = error.fieldErrors.isEmpty ? error.message : 'Confira os campos marcados.';
      });
    }
  }

  @override
  void dispose() {
    for (final c in [
      _name,
      _phone,
      _allergies,
      _medications,
      _notes,
      _height,
      _goal,
      _emergencyName,
      _emergencyPhone,
      _emergencyRelation,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Widget _field(
    TextEditingController controller,
    String label,
    String field, {
    String? hint,
    TextInputType? keyboard,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          errorText: _fieldError(field),
          errorMaxLines: 3,
        ),
      ),
    );
  }

  Widget _section(String title) => Padding(
    padding: const EdgeInsets.only(top: 6, bottom: 12),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );

  @override
  Widget build(BuildContext context) {
    final genders = [..._genders, if (_gender != null && !_genders.contains(_gender)) _gender!];
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
            Text('Editar perfil', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              'Apague um campo para removê-lo. E-mail e CPF não mudam por aqui.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            _section('Conta'),
            _field(_name, 'Nome', 'name'),
            _field(
              _phone,
              'Telefone',
              'phone',
              hint: '(81) 99999-9999',
              keyboard: TextInputType.phone,
            ),
            if (_patient) ...[
              _section('Saúde'),
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: InkWell(
                  onTap: _pickBirthDate,
                  child: InputDecorator(
                    decoration: InputDecoration(
                      labelText: 'Data de nascimento',
                      errorText: _fieldError('birthDate'),
                      suffixIcon: _birthDate == null
                          ? null
                          : IconButton(
                              tooltip: 'Apagar data',
                              icon: const Icon(Icons.close_rounded, size: 18),
                              onPressed: () => setState(() => _birthDate = null),
                            ),
                    ),
                    child: Text(
                      _birthDate == null
                          ? 'Selecionar'
                          : _birthDate!.isUtc
                          ? formatDateOnly(_birthDate!)
                          : formatDate(_birthDate!),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: _gender,
                  decoration: InputDecoration(labelText: 'Sexo', errorText: _fieldError('gender')),
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Não informar')),
                    for (final g in genders) DropdownMenuItem(value: g, child: Text(g)),
                  ],
                  onChanged: (value) => setState(() => _gender = value),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: _bloodType,
                  decoration: InputDecoration(
                    labelText: 'Tipo sanguíneo',
                    errorText: _fieldError('bloodType'),
                  ),
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Não informar')),
                    for (final t in _bloodTypes) DropdownMenuItem(value: t, child: Text(t)),
                  ],
                  onChanged: (value) => setState(() => _bloodType = value),
                ),
              ),
              _field(_allergies, 'Alergias', 'allergies', hint: 'Separe por vírgula'),
              _field(
                _medications,
                'Medicamentos em uso',
                'medications',
                hint: 'Separe por vírgula',
              ),
              _field(_notes, 'Observações', 'notes', maxLines: 3),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _field(
                      _height,
                      'Altura (cm)',
                      'heightCm',
                      keyboard: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _field(
                      _goal,
                      'Meta de peso (kg)',
                      'goalWeightKg',
                      keyboard: const TextInputType.numberWithOptions(decimal: true),
                    ),
                  ),
                ],
              ),
              _section('Contato de emergência'),
              _field(_emergencyName, 'Nome', 'emergencyContactName'),
              _field(
                _emergencyPhone,
                'Telefone',
                'emergencyContactPhone',
                keyboard: TextInputType.phone,
              ),
              _field(
                _emergencyRelation,
                'Relação',
                'emergencyContactRelation',
                hint: 'Ex.: mãe, cônjuge, amiga',
              ),
            ],
            if (_error != null) ...[
              Text(_error!, style: TextStyle(color: context.colors.danger600)),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'Salvando...' : 'Salvar'),
            ),
          ],
        ),
      ),
    );
  }
}
