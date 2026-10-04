// Formatação de datas e números no padrão brasileiro, sem depender de intl.

String _two(int n) => n.toString().padLeft(2, '0');

/// 25/12/2026
String formatDate(DateTime date) {
  final d = date.toLocal();
  return '${_two(d.day)}/${_two(d.month)}/${d.year}';
}

/// 14:30
String formatTime(DateTime date) {
  final d = date.toLocal();
  return '${_two(d.hour)}:${_two(d.minute)}';
}

/// 25/12/2026 · 14:30
String formatDateTime(DateTime date) => '${formatDate(date)} · ${formatTime(date)}';

/// Pra campos que são só "dia" (ex.: data de nascimento, que o backend
/// manda como meia-noite UTC): usa os componentes UTC pra não voltar um
/// dia ao converter pro fuso local.
String formatDateOnly(DateTime date) {
  final d = date.toUtc();
  return '${_two(d.day)}/${_two(d.month)}/${d.year}';
}

/// "Dr(a). Primeiro-nome" pro header do médico, sem duplicar quando o nome
/// cadastrado já começa com "Dr."/"Dra.".
String doctorHeaderTitle(String? fullName) {
  if (fullName == null || fullName.trim().isEmpty) return '...';
  final clean = fullName.trim().replaceFirst(RegExp(r'^dr\.?a?\.?\s+', caseSensitive: false), '');
  return 'Dr(a). ${clean.split(' ').first}';
}

/// "Dr(a). Nome completo" sem duplicar o título quando o nome já vem com
/// "Dr."/"Dra." (o médico do seed é "Dr. João Silva").
String doctorTitle(String? fullName) {
  final n = (fullName ?? '').trim();
  if (n.isEmpty) return '';
  final hasTitle = RegExp(r'^dr\.?a?\.?\s+', caseSensitive: false).hasMatch(n);
  return hasTitle ? n : 'Dr(a). $n';
}

/// Número com vírgula decimal: 88,5 (peso, IMC, metas). Os campos de
/// digitação já aceitam vírgula, então a tela e o teclado falam igual.
String formatDecimal(double value, [int decimals = 1]) =>
    value.toStringAsFixed(decimals).replaceAll('.', ',');
