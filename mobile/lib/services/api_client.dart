import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:path_provider/path_provider.dart';

import '../constants.dart';
import 'demo_api.dart';

class ApiClient {
  ApiClient._();

  static Dio? _dio;
  static PersistCookieJar? _cookieJar;

  /// Usado pela tela de debug de login (kDebugMode only).
  static String get baseUrlForDebug =>
      _dio?.options.baseUrl ?? dotenv.env['API_BASE_URL'] ?? '';

  /// URL pública do site (páginas web: esqueci a senha, comprar plano...).
  /// Diferente de [baseUrlForDebug] na web, onde a API é acessada pela
  /// origem da própria página (proxy de dev) mas os links pro site devem
  /// abrir a URL real.
  static String get siteUrl => dotenv.env['API_BASE_URL'] ?? '';

  static String _stripSlash(String url) =>
      url.endsWith('/') ? url.substring(0, url.length - 1) : url;

  static Future<Dio> get instance async {
    final existing = _dio;
    if (existing != null) return existing;

    // Na web o navegador não deixa falar direto com a Vercel (o backend não
    // manda CORS e o cookie seria cross-site), então a API passa pelo proxy
    // local de tool/dev_web.dart, que adiciona CORS. localhost:<porta do
    // app> -> localhost:8080 é same-site, então o cookie do NextAuth
    // funciona. Nativo fala direto com a URL do .env.
    final baseUrl = kDemoApi
        ? 'http://demo.invalid'
        : kIsWeb
            ? (dotenv.env['WEB_API_PROXY_URL'] ?? 'http://localhost:8080')
            : dotenv.env['API_BASE_URL'];
    if (baseUrl == null || baseUrl.isEmpty) {
      throw StateError('API_BASE_URL não definida no .env');
    }

    final dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      // Só tem efeito na web: sem isso o navegador não manda nem aceita o
      // cookie de sessão em requests cross-origin (preview local ->
      // backend na Vercel). Nativo ignora esse extra.
      extra: const {'withCredentials': true},
      // O backend rejeita toda mutação (cadastro, fila, chat, prontuário...)
      // sem Origin/Referer (lib/security.ts, checkOrigin -> 403 "Origem não
      // verificável"). Navegador manda Origin sozinho (e o proxy de dev o
      // reescreve pro site), mas o HttpClient nativo não manda nada — no
      // celular tudo isso falhava. Aqui o app se apresenta como o site.
      // Na web o navegador proíbe setar Origin, por isso o guard.
      headers: kIsWeb ? null : {'Origin': _stripSlash(baseUrl)},
    ));

    // path_provider (e por consequência PersistCookieJar/FileStorage) não
    // tem implementação web — só existe filesystem de verdade em
    // Android/iOS/desktop. Na web o próprio navegador guarda o cookie de
    // sessão; só precisamos garantir que ele é enviado (withCredentials
    // acima), não geri-lo aqui.
    if (!kIsWeb && !kDemoApi) {
      final appDir = await getApplicationDocumentsDirectory();
      final cookieJar = PersistCookieJar(
        storage: FileStorage('${appDir.path}/.cookies/'),
      );
      _cookieJar = cookieJar;
      dio.interceptors.add(CookieManager(cookieJar));
    }

    // Loga request/response (inclui credenciais no body do login) — só em
    // debug, nunca em release. Headers ficam de fora: a Vercel manda
    // dezenas de linhas de header por resposta e afogava o console.
    if (kDebugMode) {
      dio.interceptors.add(LogInterceptor(
        requestHeader: false,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
      ));
    }

    // Modo demonstração: as respostas vêm do próprio app (nada sai pra rede).
    if (kDemoApi) dio.interceptors.insert(0, DemoApi());

    _dio = dio;
    return dio;
  }

  static Future<void> clearSession() async {
    await _cookieJar?.deleteAll();
  }

  /// Lista os cookies salvos pro host informado — usado pela tela de debug
  /// de login pra confirmar se o cookie de sessão foi persistido.
  static Future<String> debugCookiesFor(String url) async {
    if (kIsWeb) return '(cookie gerenciado pelo navegador — não visível via cookie_jar na web)';
    final jar = _cookieJar;
    if (jar == null) return '(cookie jar ainda não inicializado)';
    final cookies = await jar.loadForRequest(Uri.parse(url));
    if (cookies.isEmpty) return '(nenhum cookie salvo para $url)';
    return cookies.map((c) => '${c.name}=${c.value}').join('\n');
  }
}
