/// Um horário da agenda do médico num dia
/// (GET /api/doctors/:id/slots?date=AAAA-MM-DD).
///
/// Antes o app inventava os horários (08:00 às 17:00, todo dia) e o paciente
/// só descobria que o horário estava ocupado depois de escrever o motivo da
/// consulta. Agora quem decide é o servidor, a partir da agenda que o médico
/// configurou no perfil.
class DaySlot {
  const DaySlot({
    required this.time,
    required this.startsAt,
    required this.available,
  });

  /// "HH:MM", no horário de São Paulo — é o que se mostra na tela.
  final String time;

  /// Instante em UTC (ISO). É isto que volta ao servidor no agendamento,
  /// não a hora montada no celular.
  final DateTime startsAt;

  /// false quando já passou ou quando outro paciente pegou.
  final bool available;

  factory DaySlot.fromJson(Map<String, dynamic> json) => DaySlot(
        time: json['time'] as String,
        startsAt: DateTime.parse(json['startsAt'] as String),
        available: json['available'] as bool? ?? false,
      );
}
