import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:path_provider/path_provider.dart';

class ApiClient {
  ApiClient._();

  static Dio? _dio;
  static PersistCookieJar? _cookieJar;

  /// Usado pela tela de debug de login (kDebugMode only).
  static String get baseUrlForDebug =>
      _dio?.options.baseUrl ?? dotenv.env['API_BASE_URL'] ?? '';

  static Future<Dio> get instance async {
    final existing = _dio;
    if (existing != null) return existing;

    final baseUrl = dotenv.env['API_BASE_URL'];
    if (baseUrl == null || baseUrl.isEmpty) {
      throw StateError('API_BASE_URL não definida no .env');
    }

    final appDir = await getApplicationDocumentsDirectory();
    final cookieJar = PersistCookieJar(
      storage: FileStorage('${appDir.path}/.cookies/'),
    );
    _cookieJar = cookieJar;

    final dio = Dio(BaseOptions(baseUrl: baseUrl))
      ..interceptors.add(CookieManager(cookieJar));

    // Loga request/response completos (inclui credenciais e cookies) —
    // só em debug, nunca em release.
    if (kDebugMode) {
      dio.interceptors.add(LogInterceptor(
        requestHeader: true,
        requestBody: true,
        responseHeader: true,
        responseBody: true,
      ));
    }

    _dio = dio;
    return dio;
  }

  static Future<void> clearSession() async {
    await _cookieJar?.deleteAll();
  }

  /// Lista os cookies salvos pro host informado — usado pela tela de debug
  /// de login pra confirmar se o cookie de sessão foi persistido.
  static Future<String> debugCookiesFor(String url) async {
    final jar = _cookieJar;
    if (jar == null) return '(cookie jar ainda não inicializado)';
    final cookies = await jar.loadForRequest(Uri.parse(url));
    if (cookies.isEmpty) return '(nenhum cookie salvo para $url)';
    return cookies.map((c) => '${c.name}=${c.value}').join('\n');
  }
}
