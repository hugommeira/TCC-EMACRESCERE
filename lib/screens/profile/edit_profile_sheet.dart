import 'package:flutter/material.dart';

import '../../models/user_profile.dart';
import '../../services/user_service.dart';

const _bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/// Bottom sheet pra editar as informações de saúde do perfil (PATCH
/// /api/users/[id] — só os campos do PatientProfile: nascimento, gênero,
/// tipo sanguíneo, alergias e medicações).
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
  late DateTime? _birthDate = widget.profile.birthDate;
  late final _genderController = TextEditingController(text: widget.profile.gender);
  late String? _bloodType =
      _bloodTypes.contains(widget.profile.bloodType) ? widget.profile.bloodType : null;
  late final _allergiesController =
      TextEditingController(text: widget.profile.allergies.join(', '));
  late final _medicationsController =
      TextEditingController(text: widget.profile.medications.join(', '));
  bool _saving = false;

  List<String> _splitList(String value) => value
      .split(',')
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty)
      .toList();

  Future<void> _pickBirthDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(now.year - 30),
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (picked != null) setState(() => _birthDate = picked);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    await UserService.updateProfile(
      widget.profile.id,
      birthDate: _birthDate,
      gender: _genderController.text.trim().isEmpty ? null : _genderController.text.trim(),
      bloodType: _bloodType,
      allergies: _splitList(_allergiesController.text),
      medications: _splitList(_medicationsController.text),
    );
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  void dispose() {
    _genderController.dispose();
    _allergiesController.dispose();
    _medicationsController.dispose();
    super.dispose();
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Informações de saúde', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 20),
            InkWell(
              onTap: _pickBirthDate,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Data de nascimento'),
                child: Text(
                  _birthDate == null
                      ? 'Selecionar'
                      : '${_birthDate!.day.toString().padLeft(2, '0')}/'
                          '${_birthDate!.month.toString().padLeft(2, '0')}/${_birthDate!.year}',
                ),
              ),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _genderController,
              decoration: const InputDecoration(labelText: 'Gênero'),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _bloodType,
              decoration: const InputDecoration(labelText: 'Tipo sanguíneo'),
              items: _bloodTypes
                  .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                  .toList(),
              onChanged: (value) => setState(() => _bloodType = value),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _allergiesController,
              decoration: const InputDecoration(
                labelText: 'Alergias',
                hintText: 'Separe por vírgula',
              ),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _medicationsController,
              decoration: const InputDecoration(
                labelText: 'Medicamentos em uso',
                hintText: 'Separe por vírgula',
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Salvando...' : 'Salvar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
