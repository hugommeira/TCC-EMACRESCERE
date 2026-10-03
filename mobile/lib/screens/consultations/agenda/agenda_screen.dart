import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import '../../../models/consultation.dart';
import '../../../services/consultation_service.dart';
import '../../../theme/app_theme.dart';
import '../../../utils/formatters.dart';

const _monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const _weekdayAbbrev = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/// TELA DO MÉDICO (aba Agenda do DoctorShell) — não faz parte do fluxo do
/// paciente (decisão de 2026-09-11: calendário é conceito do médico; o
/// paciente só vê "próxima consulta"). GET /api/consultations com role
/// DOCTOR devolve as consultas do próprio médico.
///
/// Agenda: carrossel de mês + calendário do mês inteiro + timeline do dia
/// (Hugo pediu o mês completo, não só a semana). Só exibe o que já existe — consultas
/// confirmadas (GET /api/consultations). Sem lembrete de medicação/
/// documentos porque essas funcionalidades não existem ainda (TODO(api)
/// se/quando existirem). Quem decide pra onde vai o botão principal é a tela
/// que monta a agenda (o shell do médico ou do paciente), via
/// [primaryActionLabel] e [onPrimaryAction] — nesta entrega, as consultas
/// marcadas.
class AgendaScreen extends StatefulWidget {
  const AgendaScreen({
    super.key,
    this.primaryActionLabel = 'VER MINHAS CONSULTAS',
    this.onPrimaryAction,
  });

  /// Botão fixo no rodapé; sem callback ele não aparece.
  final String primaryActionLabel;
  final VoidCallback? onPrimaryAction;

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> {
  DateTime _selectedDate = DateTime.now();
  late Future<List<Consultation>> _future;

  @override
  void initState() {
    super.initState();
    _future = ConsultationService.getConsultations();
  }

  void _onMonthChanged(DateTime month) {
    setState(() {
      final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
      final day = _selectedDate.day <= daysInMonth ? _selectedDate.day : 1;
      _selectedDate = DateTime(month.year, month.month, day);
    });
  }

  void _selectDay(DateTime day) {
    setState(() => _selectedDate = day);
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brand50,
      appBar: AppBar(
        backgroundColor: AppColors.brand50,
        title: const Text('Agenda'),
      ),
      body: Column(
        children: [
          _MonthSelector(selectedDate: _selectedDate, onMonthChanged: _onMonthChanged),
          const SizedBox(height: 12),
          // Mês inteiro, não só a semana: FutureBuilder só pra marcar os
          // dias que têm consulta.
          FutureBuilder<List<Consultation>>(
            future: _future,
            builder: (context, snapshot) => _MonthGrid(
              month: _selectedDate,
              selectedDate: _selectedDate,
              onSelect: _selectDay,
              isSameDay: _isSameDay,
              busyDays: {
                for (final c in snapshot.data ?? const <Consultation>[])
                  if (c.status.isActive || c.status == ConsultationStatus.completed)
                    DateTime(c.displayDate.toLocal().year, c.displayDate.toLocal().month, c.displayDate.toLocal().day),
              },
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),
          Expanded(
            child: FutureBuilder<List<Consultation>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Erro ao carregar agenda: ${snapshot.error}'));
                }

                final events = (snapshot.data ?? [])
                    .where((c) => _isSameDay(c.displayDate, _selectedDate))
                    .toList()
                  ..sort((a, b) => a.displayDate.compareTo(b.displayDate));

                if (events.isEmpty) {
                  return Center(
                    child: Text(
                      'Nada agendado para este dia.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  );
                }

                return _Timeline(consultations: events);
              },
            ),
          ),
          if (widget.onPrimaryAction != null)
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: widget.onPrimaryAction,
                    child: Text(widget.primaryActionLabel),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Cor sólida verde-petróleo bem escura, usada só no mês em foco do
/// carrossel (contraste máximo contra o fundo verde-menta claro).
const _monthFocusColor = Color(0xFF0F3D2E);

/// Carrossel de meses arrastável: PageView com viewportFraction ~0.35 pra
/// mostrar os vizinhos parcialmente. O mês central anima tamanho/peso/
/// opacidade continuamente conforme a posição de scroll (AnimatedBuilder
/// ouvindo o PageController), e o snap pro mês mais próximo é o
/// comportamento nativo do PageView. Tocar num mês lateral anima até
/// centralizá-lo.
class _MonthSelector extends StatefulWidget {
  const _MonthSelector({required this.selectedDate, required this.onMonthChanged});

  final DateTime selectedDate;
  final ValueChanged<DateTime> onMonthChanged;

  @override
  State<_MonthSelector> createState() => _MonthSelectorState();
}

class _MonthSelectorState extends State<_MonthSelector> {
  static const _centerPage = 100000;
  static const _pageCount = 200000;

  late final DateTime _anchorMonth;
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _anchorMonth = DateTime(widget.selectedDate.year, widget.selectedDate.month, 1);
    _controller = PageController(viewportFraction: 0.35, initialPage: _centerPage);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  DateTime _monthForPage(int page) {
    final offset = page - _centerPage;
    return DateTime(_anchorMonth.year, _anchorMonth.month + offset, 1);
  }

  void _goToPage(int page) {
    _controller.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: PageView.builder(
        controller: _controller,
        itemCount: _pageCount,
        onPageChanged: (page) => widget.onMonthChanged(_monthForPage(page)),
        itemBuilder: (context, index) {
          return AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              double distance;
              if (_controller.hasClients && _controller.position.haveDimensions) {
                distance = ((_controller.page ?? _centerPage.toDouble()) - index)
                    .abs()
                    .clamp(0.0, 1.0);
              } else {
                distance = index == _centerPage ? 0.0 : 1.0;
              }

              final fontSize = lerpDouble(32, 15, distance)!;
              final opacity = lerpDouble(1.0, 0.38, distance)!;
              final weight = FontWeight.lerp(FontWeight.w700, FontWeight.w400, distance)!;

              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => _goToPage(index),
                child: SizedBox(
                  height: 64,
                  child: OverflowBox(
                    maxWidth: double.infinity,
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Text(
                        _monthNames[_monthForPage(index).month - 1].toUpperCase(),
                        overflow: TextOverflow.visible,
                        softWrap: false,
                        style: TextStyle(
                          fontSize: fontSize,
                          fontWeight: weight,
                          color: _monthFocusColor.withValues(alpha: opacity),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Grade do mês inteiro (segunda a domingo), com o dia selecionado em
/// destaque, o dia de hoje com anel e um ponto nos dias que têm consulta.
/// Dias antes do dia 1 ficam em branco pra alinhar com a coluna certa.
class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.selectedDate,
    required this.onSelect,
    required this.isSameDay,
    required this.busyDays,
  });

  final DateTime month;
  final DateTime selectedDate;
  final ValueChanged<DateTime> onSelect;
  final bool Function(DateTime, DateTime) isSameDay;
  final Set<DateTime> busyDays;

  @override
  Widget build(BuildContext context) {
    final first = DateTime(month.year, month.month, 1);
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    final leadingBlanks = first.weekday - 1; // segunda = 0
    final today = DateTime.now();

    final cells = <Widget>[
      for (var i = 0; i < leadingBlanks; i++) const SizedBox.shrink(),
      for (var d = 1; d <= daysInMonth; d++)
        _DayCell(
          date: DateTime(month.year, month.month, d),
          selected: isSameDay(DateTime(month.year, month.month, d), selectedDate),
          isToday: isSameDay(DateTime(month.year, month.month, d), today),
          busy: busyDays.contains(DateTime(month.year, month.month, d)),
          onTap: () => onSelect(DateTime(month.year, month.month, d)),
        ),
    ];
    while (cells.length % 7 != 0) {
      cells.add(const SizedBox.shrink());
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          Row(
            children: [
              for (final label in _weekdayAbbrev)
                Expanded(
                  child: Center(
                    child: Text(
                      label,
                      style: const TextStyle(color: AppColors.gray400, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          for (var row = 0; row < cells.length ~/ 7; row++)
            Row(
              children: [
                for (var col = 0; col < 7; col++) Expanded(child: cells[row * 7 + col]),
              ],
            ),
        ],
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.date,
    required this.selected,
    required this.isToday,
    required this.busy,
    required this.onTap,
  });

  final DateTime date;
  final bool selected;
  final bool isToday;
  final bool busy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    // O ponto de "tem consulta" ficava DENTRO do círculo de 36px, empilhado
    // (Stack/Positioned) por cima do número — com dois dígitos (ex. "16")
    // e o dia selecionado (círculo escuro, ponto branco) o ponto acabava
    // sobrepondo o próprio número, feio (reportado por Hugo em 2026-09-16).
    // Corrigido: o ponto agora fica ABAIXO do círculo, num espaço próprio
    // e de altura fixa (reservada mesmo sem consulta, pra não pular a
    // grade), igual ao padrão comum de calendário.
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? AppColors.brand800 : Colors.transparent,
                shape: BoxShape.circle,
                border: isToday && !selected ? Border.all(color: AppColors.brand500, width: 1.5) : null,
              ),
              child: Text(
                '${date.day}',
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.gray900,
                  fontWeight: selected || isToday ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            const SizedBox(height: 3),
            SizedBox(
              width: 5,
              height: 5,
              child: busy
                  ? const DecoratedBox(
                      decoration: BoxDecoration(color: AppColors.brand500, shape: BoxShape.circle),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline({required this.consultations});

  final List<Consultation> consultations;

  String _formatTime(DateTime date) =>
      '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      itemCount: consultations.length,
      itemBuilder: (context, index) {
        final consultation = consultations[index];
        final isLast = index == consultations.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 56,
                child: Text(
                  _formatTime(consultation.displayDate),
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.brand500.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.videocam_outlined,
                      size: 16,
                      color: AppColors.brand800,
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(width: 2, color: AppColors.gray200),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Consulta online', style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(
                        // Na visão do médico o que importa é o paciente.
                        consultation.patient != null
                            ? '${consultation.patient!.name} · ${consultation.status.label}'
                            : consultation.doctor != null
                                ? doctorTitle(consultation.doctor!.name)
                                : consultation.status.label,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
