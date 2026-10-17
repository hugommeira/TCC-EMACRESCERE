import 'package:dio/dio.dart';

import '../errors/error_catalog.dart';

/// Erro padronizado de qualquer chamada à API.
///
/// O backend responde erros como `{ message, code, errors? }` (catálogo em
/// `lib/error-catalog.ts` do site). Falhas que nascem no app — sem rede,
/// timeout, resposta que não é JSON — ganham código aqui. A tela mostra
/// sempre [message]: nunca o texto técnico do Dio ou de um TypeError.
class ApiError implements Exception {
  const ApiError(
    this.code,
    this.message, {
    this.statusCode,
    this.fieldErrors = const {},
  });

  final String code;
  final String message;
  final int? statusCode;
  final Map<String, List<String>> fieldErrors;

  bool get isSessionExpired => code == 'AUTH_SESSAO_EXPIRADA';
  bool get isNetwork => code == 'REDE_SEM_CONEXAO' || code == 'REDE_TEMPO_ESGOTADO';

  /// Primeira mensagem de erro de campo, se houver.
  String? get firstFieldError {
    for (final list in fieldErrors.values) {
      if (list.isNotEmpty) return list.first;
    }
    return null;
  }

  /// Converte qualquer erro em ApiError. [fallback] é a mensagem usada quando
  /// o servidor não mandou uma (ex.: "Não foi possível carregar o chat.").
  factory ApiError.from(Object error, {String? fallback}) {
    if (error is ApiError) return error;
    if (error is DioException) return _fromDio(error, fallback: fallback);
    // Resposta em formato inesperado (ex.: página HTML no lugar do JSON e o
    // código fazendo response.data['data']): antes isso escapava dos
    // `on XFailure` e travava a tela no carregamento.
    if (error is TypeError || error is FormatException || error is NoSuchMethodError) {
      return ApiError(
        'SERVIDOR_RESPOSTA_INVALIDA',
        messageForCode('SERVIDOR_RESPOSTA_INVALIDA'),
      );
    }
    return ApiError('ERRO_INTERNO', fallback ?? messageForCode('ERRO_INTERNO'));
  }

  static ApiError _fromDio(DioException e, {String? fallback}) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      // Existe no dio do pubspec.lock; sem este caso o switch não compila.
      case DioExceptionType.transformTimeout:
        return ApiError('REDE_TEMPO_ESGOTADO', messageForCode('REDE_TEMPO_ESGOTADO'));
      case DioExceptionType.connectionError:
      case DioExceptionType.badCertificate:
        return ApiError('REDE_SEM_CONEXAO', messageForCode('REDE_SEM_CONEXAO'));
      case DioExceptionType.cancel:
        return ApiError('ERRO_INTERNO', fallback ?? messageForCode('ERRO_INTERNO'));
      case DioExceptionType.unknown:
        // SocketException/host lookup sem importar dart:io (não existe na web).
        final txt = '${e.error ?? ''} ${e.message ?? ''}';
        if (RegExp(r'Socket|host lookup|Connection|Network|XMLHttpRequest', caseSensitive: false).hasMatch(txt)) {
          return ApiError('REDE_SEM_CONEXAO', messageForCode('REDE_SEM_CONEXAO'));
        }
        return ApiError('ERRO_INTERNO', fallback ?? messageForCode('ERRO_INTERNO'));
      case DioExceptionType.badResponse:
        return _fromResponse(e.response, fallback: fallback);
    }
  }

  static ApiError _fromResponse(Response<dynamic>? res, {String? fallback}) {
    final status = res?.statusCode;
    final data = res?.data;

    if (data is Map) {
      final code = data['code'] is String ? data['code'] as String : null;
      final message = data['message'] is String ? data['message'] as String : null;
      final fields = <String, List<String>>{};
      final rawErrors = data['errors'];
      if (rawErrors is Map) {
        rawErrors.forEach((key, value) {
          if (value is List) fields['$key'] = value.whereType<String>().toList();
        });
      }
      final resolved = code ?? _codeForStatus(status);
      return ApiError(
        resolved,
        message ?? fallback ?? messageForCode(resolved),
        statusCode: status,
        fieldErrors: fields,
      );
    }

    // Corpo não-JSON (HTML de erro da Vercel, 413, 504...).
    final code = status == 401 ? 'AUTH_SESSAO_EXPIRADA' : 'SERVIDOR_RESPOSTA_INVALIDA';
    return ApiError(code, messageForCode(code), statusCode: status);
  }

  static String _codeForStatus(int? status) {
    switch (status) {
      case 401:
        return 'AUTH_SESSAO_EXPIRADA';
      case 429:
        return 'LIMITE_REQUISICOES';
      default:
        return 'ERRO_INTERNO';
    }
  }

  @override
  String toString() => message;
}

/// Atalho para as telas: texto pronto para SnackBar/erro em linha.
String errorMessage(Object error, {String? fallback}) =>
    ApiError.from(error, fallback: fallback).message;
