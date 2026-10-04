import 'package:flutter/material.dart';

import '../../../models/day_slot.dart';
import '../../../models/doctor.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/ui.dart';
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
        .where(
          (d) => d.name.toLowerCase().contains(query) || (d.specialty ?? '').toLowerCase().contains(query),
        )
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
    _pickDay(_days.first);
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

  /// Próximos dias oferecidos nos chips (hoje entra: os horários que já
  /// passaram vêm marcados como indisponíveis pelo servidor).
  static const _daysAhead = 14;

  List<DateTime> get _days {
    final agora = DateTime.now();
    final hoje = DateTime(agora.year, agora.month, agora.day);
    return [for (var i = 0; i < _daysAhead; i++) hoje.add(Duration(days: i))];
  }

  Future<void> _pickDay(DateTime day) async {
    setState(() {
      _selectedDate = day;
    });
    final doctor = _selectedDoctor;
    if (doctor != null) await _loadSlots(doctor.id, day);
  }

  Future<void> _submit() async {
    final doctor = _selectedDoctor;
    final slot = _selectedSlot;
    if (doctor == null || slot == null) return;
    if (_complaintController.text.trim().length < 10) {
      setState(() {
        _error = 'Descreva o motivo da consulta (mínimo 10 caracteres).';
      });
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
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
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

  static const _monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  static const _weekdayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  static const _weekdayLong = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

  String _dayLabel(DateTime d) => '${_weekdayLong[d.weekday - 1]}, ${formatDate(d).substring(0, 5)}';

  String? get _fee {
    final f = _selectedDoctor?.consultationFee;
    return f == null ? null : 'R\$ ${f.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final (stepNo, stepName, nextName, fraction) = switch (_step) {
      _Step.doctor => (1, 'Escolha o médico', 'Data a seguir', 1 / 3),
      _Step.datetime => (2, 'Data e horário', 'Motivo a seguir', 2 / 3),
      _Step.complaint => (3, 'Motivo da consulta', 'Pagamento a seguir', 1.0),
    };

    return PopScope(
      canPop: _step == _Step.doctor,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _back();
      },
      child: Scaffold(
        backgroundColor: ds.bg,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 18, 18, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: _back,
                      tooltip: 'Voltar',
                      icon: Icon(Icons.arrow_back_ios_new_rounded, color: ds.text, size: 20),
                    ),
                    const SizedBox(width: 4),
                    Expanded(child: Text('Agendar consulta', style: AppType.title(24, ds.title))),
                    const ThemeToggle(),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 10, 22, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Passo $stepNo de 3 · $stepName',
                            style: TextStyle(
                              fontFamily: AppType.sans,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: ds.link,
                            ),
                          ),
                        ),
                        Text(
                          nextName,
                          style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        height: 6,
                        color: ds.chip,
                        alignment: Alignment.centerLeft,
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: fraction),
                          duration: const Duration(milliseconds: 900),
                          curve: Curves.easeOutCubic,
                          builder: (context, f, _) => FractionallySizedBox(
                            widthFactor: f,
                            child: Container(
                              decoration: const BoxDecoration(
                                borderRadius: BorderRadius.all(Radius.circular(999)),
                                gradient: LinearGradient(
                                  colors: [AppColors.brand700, AppColors.brand500, AppColors.leaf],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: switch (_step) {
                  _Step.doctor => _buildDoctorStep(),
                  _Step.datetime => _buildDatetimeStep(),
                  _Step.complaint => _buildComplaintStep(),
                },
              ),
              if (_step != _Step.doctor) _bottomSheet(),
            ],
          ),
        ),
      ),
    );
  }

  /// Folha fixa embaixo: resumo, valor, reserva de 30 min, botão e política.
  Widget _bottomSheet() {
    final ds = context.ds;
    final slot = _selectedSlot;
    final date = _selectedDate;
    final summary = slot != null && date != null
        ? '${_dayLabel(date)} às ${slot.time}'
        : 'Escolha um horário';
    final isDatetime = _step == _Step.datetime;
    return Container(
      padding: EdgeInsets.fromLTRB(18, 16, 18, 24 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: ds.card,
        border: Border(top: BorderSide(color: ds.line)),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: ds.shadow.withValues(alpha: 0.35),
            blurRadius: 34,
            offset: const Offset(0, -16),
            spreadRadius: -22,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      summary,
                      style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _fee ?? 'Valor definido pelo médico',
                      style: AppType.title(_fee == null ? 16 : 22, ds.title, height: 1.25),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 150,
                child: Text(
                  'Horário reservado por 30 min até o pagamento',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.muted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ShineButton(
            label: isDatetime ? 'Continuar' : 'Continuar para o pagamento',
            trailing: isDatetime ? Icons.chevron_right_rounded : null,
            loading: _submitting,
            onPressed: isDatetime
                ? (_selectedSlot != null
                      ? () => setState(() {
                          _step = _Step.complaint;
                        })
                      : null)
                : _submit,
          ),
          const SizedBox(height: 12),
          Text(
            'Cancelando com 24 h ou mais de antecedência, o reembolso é integral. '
            'Com menos de 24 h, ou em caso de falta, não há reembolso.',
            textAlign: TextAlign.center,
            style: TextStyle(fontFamily: AppType.sans, fontSize: 12, height: 1.45, color: ds.muted),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorStep() {
    final ds = context.ds;
    return ListView(
      padding: EdgeInsets.fromLTRB(18, 16, 18, 24 + MediaQuery.paddingOf(context).bottom),
      children: [
        TextField(
          controller: _searchController,
          onChanged: (_) => setState(() {}),
          style: TextStyle(fontFamily: AppType.sans, color: ds.text),
          decoration: InputDecoration(
            hintText: 'Buscar por nome ou especialidade',
            prefixIcon: Icon(Icons.search_rounded, color: ds.muted),
            fillColor: ds.card,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: BorderSide(color: ds.line),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: AppColors.brand500, width: 2),
            ),
          ),
        ),
        const SizedBox(height: 14),
        FutureBuilder<List<Doctor>>(
          future: _doctorsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.all(32),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Erro ao carregar médicos: ${snapshot.error}', style: TextStyle(color: ds.text)),
              );
            }
            final doctors = _filteredDoctors;
            if (doctors.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Text('Nenhum médico encontrado', style: TextStyle(color: ds.muted)),
                ),
              );
            }
            return Column(
              children: [
                for (final d in doctors) ...[
                  _DoctorCard(doctor: d, onTap: () => _selectDoctor(d)),
                  const SizedBox(height: 12),
                ],
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildDatetimeStep() {
    final ds = context.ds;
    final doctor = _selectedDoctor!;
    final selected = _selectedDate ?? _days.first;
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
      children: [
        _DoctorCard(
          doctor: doctor,
          onTap: () => setState(() => _step = _Step.doctor),
          trailingLabel: 'Trocar',
        ),
        const SizedBox(height: 14),
        Text(
          '${_monthNames[selected.month - 1]} de ${selected.year}',
          style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 70,
          child: LayoutBuilder(
            builder: (context, box) {
              // 6 chips por tela, como na prancheta; o resto rola de lado.
              final w = (box.maxWidth - 8 * 5) / 6;
              return ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _days.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final d = _days[i];
                  final on =
                      _selectedDate != null &&
                      d.year == _selectedDate!.year &&
                      d.month == _selectedDate!.month &&
                      d.day == _selectedDate!.day;
                  return SizedBox(
                    width: w,
                    child: _DayChip(
                      day: d,
                      label: _weekdayShort[d.weekday - 1],
                      selected: on,
                      onTap: () => _pickDay(d),
                    ),
                  );
                },
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Text(
                'Horários · ${_dayLabel(selected)}',
                style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
              ),
            ),
            Text(
              'consultas de 60 min',
              style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: ds.muted),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_slotsLoading)
          // Mesma altura da grade de horários: a tela não pula ao trocar de dia.
          const SizedBox(height: 108, child: Center(child: CircularProgressIndicator()))
        else if (_slotsError != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_slotsError!, style: TextStyle(color: context.colors.danger600)),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => _loadSlots(doctor.id, selected),
                child: const Text('Tentar de novo'),
              ),
            ],
          )
        else if (_slots.isEmpty)
          Text('Este médico não atende nesse dia. Escolha outro dia.', style: TextStyle(color: ds.muted))
        else ...[
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1.75,
            children: [
              for (final slot in _slots)
                _SlotChip(
                  slot: slot,
                  selected: _selectedSlot?.time == slot.time,
                  onTap: () => setState(() {
                    _selectedSlot = slot;
                  }),
                ),
            ],
          ),
          if (!_slots.any((s) => s.available)) ...[
            const SizedBox(height: 8),
            Text('Todos os horários deste dia já foram preenchidos.', style: TextStyle(color: ds.muted)),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              _Legend(color: ds.card, border: ds.line2, label: 'Livre'),
              const SizedBox(width: 14),
              _Legend(color: ds.busy, label: 'Ocupado'),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildComplaintStep() {
    final ds = context.ds;
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
      children: [
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.colors.dangerBg,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(_error!, style: TextStyle(color: context.colors.danger600)),
          ),
          const SizedBox(height: 14),
        ],
        DsCard(
          padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
          child: TextField(
            controller: _complaintController,
            maxLines: 5,
            maxLength: 500,
            style: TextStyle(fontFamily: AppType.sans, color: ds.text, height: 1.45),
            decoration: InputDecoration(
              labelText: 'Motivo da consulta',
              hintText: 'Ex.: acompanhamento mensal, dificuldade em manter a dieta...',
              alignLabelWithHint: true,
              filled: false,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              counterStyle: TextStyle(color: ds.muted),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'O médico lê o motivo antes da consulta. Mínimo de 10 caracteres.',
          style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
        ),
      ],
    );
  }
}

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({required this.doctor, required this.onTap, this.trailingLabel});

  final Doctor doctor;
  final VoidCallback onTap;
  final String? trailingLabel;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final details = [
      if (doctor.specialty != null && doctor.specialty!.isNotEmpty) doctor.specialty!,
      if (trailingLabel != null) 'CRM verificado',
      if (trailingLabel == null && doctor.consultationFee != null)
        'R\$ ${doctor.consultationFee!.toStringAsFixed(2).replaceAll('.', ',')}',
    ].join(' · ');
    return DsCard(
      radius: 22,
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Row(
        children: [
          InitialsTile(name: doctor.name, size: 50),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doctorTitle(doctor.name),
                  style: TextStyle(fontFamily: AppType.sans, fontWeight: FontWeight.w700, color: ds.title),
                ),
                if (details.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    details,
                    style: TextStyle(fontFamily: AppType.sans, fontSize: 13, color: ds.muted),
                  ),
                ],
              ],
            ),
          ),
          if (trailingLabel != null)
            Text(
              trailingLabel!,
              style: TextStyle(
                fontFamily: AppType.sans,
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: ds.link,
              ),
            )
          else
            Icon(Icons.chevron_right_rounded, color: ds.muted),
        ],
      ),
    );
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({required this.day, required this.label, required this.selected, required this.onTap});

  final DateTime day;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final fg = selected ? Colors.white : ds.text;
    return Semantics(
      button: true,
      selected: selected,
      label: '$label ${day.day}',
      excludeSemantics: true,
      // Só a cor muda, num esmaecimento curto. (A versão anterior animava
      // degradê, sombra e escala juntos e piscava ao trocar de dia.)
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: selected ? AppColors.brand700 : ds.card,
            border: Border.all(color: selected ? AppColors.brand700 : ds.line),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontFamily: AppType.sans,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: fg.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 4),
              Text('${day.day}', style: AppType.title(22, fg, height: 1)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({required this.slot, required this.selected, required this.onTap});

  final DaySlot slot;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ds = context.ds;
    final busy = !slot.available;
    final on = selected && !busy;
    return Semantics(
      button: true,
      enabled: !busy,
      selected: on,
      label: busy ? '${slot.time}, ocupado' : slot.time,
      excludeSemantics: true,
      child: PressScale(
        scale: 0.95,
        child: GestureDetector(
          onTap: busy ? null : onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: busy ? ds.busy : (on ? ds.sel : ds.card),
              borderRadius: BorderRadius.circular(14),
              border: busy || on ? null : Border.all(color: ds.line2),
              boxShadow: on
                  ? [
                      BoxShadow(
                        color: ds.shadow,
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                        spreadRadius: -12,
                      ),
                    ]
                  : null,
            ),
            child: Text(
              slot.time,
              style: TextStyle(
                fontFamily: AppType.sans,
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: busy ? ds.busyFg : (on ? ds.selFg : ds.text),
                decoration: busy ? TextDecoration.lineThrough : null,
                decorationColor: ds.busyFg,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label, this.border});

  final Color color;
  final Color? border;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
            border: border == null ? null : Border.all(color: border!),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(fontFamily: AppType.sans, fontSize: 12, color: context.ds.muted),
        ),
      ],
    );
  }
}
