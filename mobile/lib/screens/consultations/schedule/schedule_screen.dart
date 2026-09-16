import 'package:flutter/material.dart';

import '../../../models/doctor.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/formatters.dart';

enum _Step { doctor, datetime, complaint }

const _paymentMethods = {
  'PIX': 'Pix',
  'BOLETO': 'Boleto',
  'CREDIT_CARD': 'Cartão de crédito',
};

/// Agendamento com médico e horário específicos (POST /api/consultations) —
/// espelha o ScheduleWizard do site, que nunca tinha sido trazido pro app
/// (o app só tinha o modelo on-demand, ver queue_screen.dart).
class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  _Step _step = _Step.doctor;

  late Future<List<Doctor>> _doctorsFuture;
  final _searchController = TextEditingController();
  List<Doctor> _allDoctors = [];

  Doctor? _selectedDoctor;
  DateTime? _selectedDate;
  String? _selectedTime;

  final _complaintController = TextEditingController();
  String _paymentMethod = 'PIX';

  bool _submitting = false;
  String? _error;

  static final _timeSlots = List.generate(10, (i) => '${(8 + i).toString().padLeft(2, '0')}:00');

  @override
  void initState() {
    super.initState();
    _doctorsFuture = _loadDoctors();
  }

  Future<List<Doctor>> _loadDoctors() async {
    final doctors = await ConsultationService.getDoctors();
    _allDoctors = doctors;
    return doctors;
  }

  List<Doctor> get _filteredDoctors {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return _allDoctors;
    return _allDoctors
        .where((d) =>
            d.name.toLowerCase().contains(query) ||
            (d.specialty ?? '').toLowerCase().contains(query))
        .toList();
  }

  void _selectDoctor(Doctor doctor) {
    setState(() {
      _selectedDoctor = doctor;
      _step = _Step.datetime;
    });
  }

  Future<void> _pickDate() async {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(tomorrow.year, tomorrow.month, tomorrow.day),
      firstDate: DateTime(tomorrow.year, tomorrow.month, tomorrow.day),
      lastDate: tomorrow.add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _selectedTime = null;
      });
    }
  }

  Future<void> _submit() async {
    final doctor = _selectedDoctor;
    final date = _selectedDate;
    final time = _selectedTime;
    if (doctor == null || date == null || time == null) return;
    if (_complaintController.text.trim().length < 10) {
      setState(() => _error = 'Descreva o motivo da consulta (mínimo 10 caracteres).');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    final hour = int.parse(time.split(':')[0]);
    final scheduledAt = DateTime(date.year, date.month, date.day, hour);

    try {
      await ConsultationService.scheduleConsultation(
        doctorId: doctor.id,
        scheduledAt: scheduledAt,
        chiefComplaint: _complaintController.text.trim(),
        paymentMethod: _paymentMethod,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = 'Não foi possível agendar: $e';
      });
    }
  }

  void _back() {
    if (_step == _Step.complaint) {
      setState(() => _step = _Step.datetime);
    } else if (_step == _Step.datetime) {
      setState(() => _step = _Step.doctor);
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _complaintController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _back),
        title: const Text('Agendar consulta'),
      ),
      body: switch (_step) {
        _Step.doctor => _buildDoctorStep(),
        _Step.datetime => _buildDatetimeStep(),
        _Step.complaint => _buildComplaintStep(),
      },
    );
  }

  Widget _buildDoctorStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Passo 1 de 3 · Escolha o médico',
              style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _searchController,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: 'Buscar por nome ou especialidade...',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: FutureBuilder<List<Doctor>>(
              future: _doctorsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Erro ao carregar médicos: ${snapshot.error}'));
                }
                final doctors = _filteredDoctors;
                if (doctors.isEmpty) {
                  return const Center(child: Text('Nenhum médico encontrado'));
                }
                return ListView.separated(
                  itemCount: doctors.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => _DoctorTile(
                    doctor: doctors[index],
                    onTap: () => _selectDoctor(doctors[index]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatetimeStep() {
    final doctor = _selectedDoctor!;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Passo 2 de 3 · Data e horário', style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 4),
          Text('Agendando com ${doctorTitle(doctor.name)}',
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.calendar_today_outlined, size: 18),
            label: Text(
              _selectedDate == null
                  ? 'Escolher data'
                  : '${_selectedDate!.day.toString().padLeft(2, '0')}/'
                      '${_selectedDate!.month.toString().padLeft(2, '0')}/${_selectedDate!.year}',
            ),
          ),
          if (_selectedDate != null) ...[
            const SizedBox(height: 20),
            Text('Horário', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final time in _timeSlots)
                  ChoiceChip(
                    label: Text(time),
                    selected: _selectedTime == time,
                    onSelected: (_) => setState(() => _selectedTime = time),
                  ),
              ],
            ),
          ],
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: (_selectedDate != null && _selectedTime != null)
                  ? () => setState(() => _step = _Step.complaint)
                  : null,
              child: const Text('Continuar'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComplaintStep() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Passo 3 de 3 · Motivo e pagamento',
              style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 16),
          if (_error != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.danger500.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.card),
              ),
              child: Text(_error!, style: const TextStyle(color: AppColors.danger600)),
            ),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _complaintController,
            maxLines: 5,
            maxLength: 500,
            decoration: const InputDecoration(
              labelText: 'Descreva o motivo da consulta',
              hintText: 'Ex: Acompanhamento mensal do tratamento, dificuldade em manter a dieta...',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 8),
          Text('Forma de pagamento', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          RadioGroup<String>(
            groupValue: _paymentMethod,
            onChanged: (value) => setState(() => _paymentMethod = value!),
            child: Column(
              children: [
                for (final entry in _paymentMethods.entries)
                  RadioListTile<String>(
                    contentPadding: EdgeInsets.zero,
                    title: Text(entry.value),
                    value: entry.key,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Confirmar agendamento'),
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorTile extends StatelessWidget {
  const _DoctorTile({required this.doctor, required this.onTap});

  final Doctor doctor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final initials = doctor.name
        .trim()
        .split(RegExp(r'\s+'))
        .take(2)
        .map((part) => part.isEmpty ? '' : part[0])
        .join()
        .toUpperCase();

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.cardLarge),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.brand100,
                child: Text(initials, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.brand700)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doctorTitle(doctor.name), style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 2),
                    Text(
                      [
                        if (doctor.specialty != null) doctor.specialty!,
                        if (doctor.consultationFee != null)
                          'R\$ ${doctor.consultationFee!.toStringAsFixed(2).replaceAll('.', ',')}',
                      ].join(' · '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.gray400),
            ],
          ),
        ),
      ),
    );
  }
}
