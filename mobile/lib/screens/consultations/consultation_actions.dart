import 'package:flutter/material.dart';

import '../../models/consultation.dart';
import 'consultation_detail_screen.dart';
import 'queue/awaiting_payment_screen.dart';
import 'queue/queue_waiting_screen.dart';
import 'room/consultation_room_screen.dart';

/// Texto do botão principal do card de consulta, conforme o estado.
String primaryActionLabel(Consultation c) {
  if (c.isAwaitingPayment) return 'Pagar';
  return switch (c.status) {
    ConsultationStatus.waiting => 'Ver fila',
    ConsultationStatus.inProgress => 'Entrar',
    _ => 'Ver mais',
  };
}

/// Abre a tela certa pra consulta: pagamento pendente, fila, sala em
/// andamento ou detalhe (prontuário/prescrição). Devolve quando a tela
/// fecha, pra quem chamou recarregar.
Future<void> openConsultation(BuildContext context, Consultation c) {
  final Widget screen;
  if (c.isAwaitingPayment) {
    screen = AwaitingPaymentScreen(consultationId: c.id, payment: c.payment!);
  } else if (c.status == ConsultationStatus.waiting) {
    screen = QueueWaitingScreen(consultationId: c.id);
  } else if (c.status == ConsultationStatus.inProgress) {
    // Vale pra on-demand E agendada: quando o médico inicia uma consulta
    // marcada, "Entrar" também tem que cair na sala (chat), não no detalhe.
    screen = ConsultationRoomScreen(consultationId: c.id);
  } else {
    screen = ConsultationDetailScreen(consultationId: c.id);
  }
  return Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
}
