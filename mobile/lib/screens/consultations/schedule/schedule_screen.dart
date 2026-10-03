import 'package:flutter/material.dart';

import '../../../models/day_slot.dart';
import '../../../models/doctor.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/formatters.dart';
import '../payment/consultation_payment_screen.dart';

enum _Step { doctor, datetime, complaint }

/// Agendamento com médico e horário específicos — espelha o ScheduleWizard
/// do site.
///
/// Duas correções em relação à versão anterior:
///   - os horários vinham de uma lista fixa de 08:00 às 17:00, inventada no
///     app; agora vêm de GET /api/doctors/:id/slots, com os ocupados e os
///     que já passaram desabilitados;
///   - o agendamento terminava sem cobrança, e o médico não conseguia
///     iniciar a consulta (o backend exige pagamento confirmado). Agora,
///     criada a consulta, a tela leva ao pagamento.
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
  DaySlot? _selectedSlot;

  List<DaySlot> _slots = [];
  bool _slotsLoading = false;
  String? _slotsError;

  final _complaintController = TextEditingController();

  bool _submitting = false;
  String? _error;

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
      _selectedDate = null;
      _selectedSlot = null;
      _slots = [];
      _slotsError = null;
      _step = _Step.datetime;
    });
  }

  Future<void> _loadSlots(String doctorId, DateTime date) async {
    setState(() {
      _slotsLoading = true;
      _slotsError = null;
      _slots = [];
      _selectedSlot = null;
    });
    try {
      final slots = await ConsultationService.getDoctorSlots(doctorId, date);
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _slotsLoading = false;
      });
    } on ConsultationFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _slotsLoading = false;
        _slotsError = e.message;
      });
    }
  }

  Future<void> _pickDate() async {
    // Hoje entra: os horários que já passaram vêm marcados como
    // indisponíveis pelo servidor, então não há risco de agendar no passado.
    final agora = DateTime.now();
    final hoje = DateTime(agora.year, agora.month, agora.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? hoje,
      firstDate: hoje,
      lastDate: hoje.add(const Duration(days: 90)),
    );
    if (picked != null) {
      setState(() { _selectedDate = picked; });
      final doctor = _selectedDoctor;
      if (doctor != null) await _loadSlots(doctor.id, picked);
    }
  }

  Future<void> _submit() async {
    final doctor = _selectedDoctor;
    final slot = _selectedSlot;
    if (doctor == null || slot == null) return;
    if (_complaintController.text.trim().length < 10) {
      setState(() { _error = 'Descreva o motivo da consulta (mínimo 10 caracteres).'; });
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final consulta = await ConsultationService.scheduleConsultation(
        doctorId: doctor.id,
        // O instante vem do servidor (slot.startsAt), não montado no celular.
        scheduledAt: slot.startsAt,
        chiefComplaint: _complaintController.text.trim(),
      );
      if (!mounted) return;

      // O resultado não importa aqui: a consulta já existe, e a lista precisa
      // recarregar tanto se o paciente pagou quanto se escolheu "pagar depois".
      await ConsultationPaymentScreen.show(
        context,
        consultationId: consulta.id,
        doctorName: doctorTitle(doctor.name),
        scheduledAt: slot.startsAt.toLocal(),
        amount: doctor.consultationFee,
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ConsultationFailure catch (e) {
      if (!mounted) return;
      // Alguém pegou o horário nesse meio-tempo: volta pra agenda atualizada.
      if (e.isSlotTaken) {
        final date = _selectedDate;
        setState(() {
          _submitting = false;
          _step = _Step.datetime;
          _error = null;
        });
        if (date != null) await _loadSlots(doctor.id, date);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.message)),
          );
        }
        return;
      }
      setState(() {
        _submitting = false;
        _error = e.message;
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
            if (_slotsLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_slotsError != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_slotsError!, style: const TextStyle(color: AppColors.danger600)),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () => _loadSlots(doctor.id, _selectedDate!),
                    child: const Text('Tentar de novo'),
                  ),
                ],
              )
            else if (_slots.isEmpty)
              const Text(
                'Este médico não atende nesse dia. Escolha outra data.',
                style: TextStyle(color: AppColors.gray600),
              )
            else if (!_slots.any((s) => s.available))
              const Text(
                'Todos os horários deste dia já foram preenchidos. Escolha outra data.',
                style: TextStyle(color: AppColors.gray600),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final slot in _slots)
                    ChoiceChip(
                      label: Text(slot.time),
                      selected: _selectedSlot?.time == slot.time,
                      onSelected: slot.available
                          ? (_) => setState(() { _selectedSlot = slot; })
                          : null,
                    ),
                ],
              ),
          ],
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedSlot != null
                  ? () => setState(() { _step = _Step.complaint; })
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
          Text('Passo 3 de 3 · Motivo da consulta',
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
          if (_selectedSlot != null)
            Text(
              'Horário escolhido: ${_selectedSlot!.time} de '
              '${_selectedDate!.day.toString().padLeft(2, '0')}/'
              '${_selectedDate!.month.toString().padLeft(2, '0')}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          const SizedBox(height: 16),
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
                  : const Text('Continuar para o pagamento'),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'O horário fica reservado para você; a consulta só é confirmada '
            'depois do pagamento.',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
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
