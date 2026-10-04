/// ─── Escopo: fila on-demand ─────────────────────────────────────────────────
///
/// Nesta entrega o atendimento é só por agendamento. A fila on-demand virou
/// trabalho futuro (TCC, seção 5.5.1), mas NADA dela foi apagado: as telas
/// `screens/consultations/queue/*`, `screens/doctor/doctor_queue_screen.dart`,
/// o `services/queue_service.dart` e os campos do modelo continuam no
/// repositório. Esta chave só esconde os pontos de entrada da interface — pra
/// reativar a fila, basta trocar para true.
///
/// Espelha `QUEUE_ENABLED` em `lib/constants.ts` no site: as duas pontas
/// precisam concordar, senão o app oferece uma fila que o backend esconde.
///
/// É `final`, e não `const`, de propósito: com uma constante de compilação o
/// analisador trataria todo o código atrás da chave como `dead_code` e enxeria
/// o projeto de avisos — justamente o código que queremos preservar intacto.
final bool kQueueEnabled = false;

/// Modo demonstração: o app responde a API sozinho, com dados de exemplo
/// (`lib/services/demo_api.dart`). Só liga em build com
/// `--dart-define=DEMO_API=true` — o app normal nunca usa.
const bool kDemoApi = bool.fromEnvironment('DEMO_API');
