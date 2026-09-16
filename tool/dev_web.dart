// Ambiente de desenvolvimento pra rodar o app no Chrome sem mexer no backend.
//
// Problema: o site (Next.js na Vercel) não manda cabeçalhos CORS e a sessão
// é um cookie do NextAuth — o Flutter rodando em `localhost` não consegue
// nem ler as respostas da API, quanto mais guardar o cookie.
//
// Solução: este script sobe duas coisas —
//   1. `flutter run -d web-server` em http://localhost:5000  (o app)
//   2. um proxy de API em http://localhost:8080 que repassa /api/* pra
//      API real (API_BASE_URL do .env) e ADICIONA os cabeçalhos CORS pra
//      origem do app.
//
// Por que não servir o app pelo proxy também (mesma origem)? Porque o
// cliente de debug do Flutter (DWDS: hot reload/restart) usa a URL
// absoluta do dev server e não passa pelo proxy — quebrava o hot restart
// e a carga inicial. Com o app em :5000 e a API em :8080 o DWDS funciona
// como foi feito, e o cookie continua funcionando porque localhost:5000 e
// localhost:8080 são o MESMO site pro navegador (porta não conta pra
// SameSite), então o cookie SameSite=Lax do NextAuth é enviado e aceito.
//
// Uso:
//   dart run tool/dev_web.dart
//   -> abre http://localhost:5000 no Chrome
//
// As teclas do `flutter run` (r = hot reload, R = hot restart, q = sair)
// funcionam neste terminal, e também por HTTP:
//   GET http://localhost:8080/__dev/reload    (r)
//   GET http://localhost:8080/__dev/restart   (R)
//
// Isso é SÓ pra desenvolvimento local. O app Android continua falando com
// a API direto (ver lib/services/api_client.dart).

import 'dart:async';
import 'dart:io';

// :5000 é o padrão pra rodar manualmente (`dart run tool/dev_web.dart`).
// Quando o harness sobe o preview, ele injeta PORT com uma porta livre
// (5000 pode estar ocupada por outra coisa na máquina) — nesse caso usamos
// a porta dele em vez do fixo. Não afeta o cookie: SameSite=Lax olha o
// site (domínio), não a porta.
final _flutterPort = int.tryParse(Platform.environment['PORT'] ?? '') ?? 5000;
const _proxyPort = 8080;

late final Uri _apiTarget;
Process? _flutter;

Future<void> main(List<String> args) async {
  _apiTarget = Uri.parse(_readApiBaseUrl());

  final flutter = await Process.start(
    'flutter',
    [
      'run',
      '-d', 'web-server',
      '--web-hostname', 'localhost',
      '--web-port', '$_flutterPort',
      ...args,
    ],
    runInShell: true,
  );
  _flutter = flutter;
  // Saída do flutter vai pro nosso terminal; nosso teclado vai pro flutter.
  // (listen + add, não addStream/pipe: esses "travam" o sink e nem nossos
  // writeln nem o /__dev/ conseguiriam escrever depois.)
  flutter.stdout.listen(stdout.add);
  flutter.stderr.listen(stderr.add);
  try {
    stdin.listen(flutter.stdin.add, onError: (_) {});
  } catch (_) {
    // Sem stdin (rodando por um launcher, não por terminal): só /__dev/.
  }
  // Se o `flutter run` morrer (q, erro de compilação fatal), derruba o proxy.
  unawaited(flutter.exitCode.then((code) => exit(code)));

  final server = await HttpServer.bind(InternetAddress.loopbackIPv4, _proxyPort);
  stderr.writeln('');
  stderr.writeln('[dev_web] app          http://localhost:$_flutterPort  (abra este)');
  stderr.writeln('[dev_web] proxy API    http://localhost:$_proxyPort/api/*  ->  $_apiTarget');
  stderr.writeln('[dev_web] hot reload   GET /__dev/reload  |  hot restart  GET /__dev/restart');
  stderr.writeln('');

  await for (final request in server) {
    unawaited(_handle(request).catchError((Object e) {
      stderr.writeln('[dev_web] erro em ${request.method} ${request.uri}: $e');
      try {
        request.response.statusCode = HttpStatus.badGateway;
        _addCors(request, request.response);
        request.response.write('dev_web proxy: $e');
        request.response.close();
      } catch (_) {}
    }));
  }
}

String _readApiBaseUrl() {
  final env = File('.env');
  if (!env.existsSync()) {
    stderr.writeln('[dev_web] .env não encontrado — rode a partir da raiz do projeto.');
    exit(1);
  }
  for (final line in env.readAsLinesSync()) {
    final trimmed = line.trim();
    if (trimmed.startsWith('API_BASE_URL=')) {
      final value = trimmed.substring('API_BASE_URL='.length).trim();
      if (value.isNotEmpty) return value;
    }
  }
  stderr.writeln('[dev_web] API_BASE_URL não definida no .env');
  exit(1);
}

Future<void> _handle(HttpRequest request) async {
  final path = request.uri.path;

  if (path == '/__dev/reload' || path == '/__dev/restart') {
    final key = path.endsWith('reload') ? 'r' : 'R';
    _flutter?.stdin.write('$key\n');
    request.response
      ..headers.contentType = ContentType.text
      ..write(key == 'r' ? 'hot reload enviado\n' : 'hot restart enviado\n');
    await request.response.close();
    return;
  }

  // Abriram o proxy no navegador em vez do app (era só um 404 em texto):
  // manda pro lugar certo.
  if (path == '/' || path == '/index.html') {
    request.response
      ..statusCode = HttpStatus.found
      ..headers.set('location', 'http://localhost:$_flutterPort/');
    await request.response.close();
    return;
  }

  if (path != '/api' && !path.startsWith('/api/')) {
    // Com CORS mesmo no 404: redirects do NextAuth (login/signout) caem
    // aqui e sem o header o navegador loga erro à toa.
    _addCors(request, request.response);
    request.response
      ..statusCode = HttpStatus.notFound
      ..headers.contentType = ContentType.text
      ..write('dev_web: este proxy só serve /api/*. O app está em '
          'http://localhost:$_flutterPort\n');
    await request.response.close();
    return;
  }

  // Preflight CORS (Dio manda OPTIONS antes de POST/PATCH com JSON).
  if (request.method == 'OPTIONS') {
    _addCors(request, request.response);
    request.response.statusCode = HttpStatus.noContent;
    await request.response.close();
    return;
  }

  await _proxyApi(request);
}

/// Libera a origem que pediu (app em localhost:5000) com credenciais —
/// é isso que o backend real não faz e que este proxy existe pra suprir.
void _addCors(HttpRequest request, HttpResponse response) {
  final origin = request.headers.value('origin');
  if (origin == null) return;
  response.headers
    ..set('access-control-allow-origin', origin)
    ..set('access-control-allow-credentials', 'true')
    ..set('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    ..set(
      'access-control-allow-headers',
      request.headers.value('access-control-request-headers') ?? 'content-type',
    )
    ..set('access-control-max-age', '600')
    ..add('vary', 'Origin');
}

final _client = HttpClient()
  // Repassa os bytes exatamente como vieram (inclusive gzip) — o navegador
  // descomprime sozinho pelo Content-Encoding.
  ..autoUncompress = false;

Future<void> _proxyApi(HttpRequest request) async {
  final upstreamUri = _apiTarget.replace(
    path: request.uri.path,
    query: request.uri.hasQuery ? request.uri.query : null,
  );

  final upstream = await _client.openUrl(request.method, upstreamUri)
    ..followRedirects = false;

  request.headers.forEach((name, values) {
    // Host é definido pelo HttpClient a partir da URL. Origin/Referer são
    // reescritos pra parecer um request same-origin feito no próprio site.
    switch (name.toLowerCase()) {
      case 'host':
      case 'content-length':
        return;
      case 'origin':
        upstream.headers.set(name, _apiTarget.origin);
        return;
      case 'referer':
        upstream.headers.set(name, '${_apiTarget.origin}/');
        return;
      default:
        for (final v in values) {
          upstream.headers.add(name, v);
        }
    }
  });

  await upstream.addStream(request);
  final upstreamResponse = await upstream.close();

  final response = request.response
    // Sem buffer: streams longos (/api/chat/*/stream, SSE da fila) precisam
    // chegar ao navegador conforme o backend manda.
    ..bufferOutput = false
    ..statusCode = upstreamResponse.statusCode;

  upstreamResponse.headers.forEach((name, values) {
    switch (name.toLowerCase()) {
      // Controlados pelo próprio HttpResponse.
      case 'transfer-encoding':
      case 'connection':
      case 'content-length':
        return;
      // Redirects do backend apontam pro host real (login do NextAuth
      // responde 302). Traz pro proxy: o navegador segue, cai no 404 acima
      // e o AuthService confirma o login via /api/auth/session.
      case 'location':
        for (final v in values) {
          response.headers.add(name, v.replaceFirst(_apiTarget.origin, 'http://localhost:$_proxyPort'));
        }
        return;
      default:
        for (final v in values) {
          response.headers.add(name, v);
        }
    }
  });
  _addCors(request, response);

  await response.addStream(upstreamResponse);
  await response.close();
}
