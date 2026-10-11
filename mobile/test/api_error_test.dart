import 'package:dio/dio.dart';
import 'package:emacrescere_app/services/api_error.dart';
import 'package:emacrescere_app/services/consultation_service.dart';
import 'package:emacrescere_app/services/doctor_service.dart';
import 'package:flutter_test/flutter_test.dart';

/// Testes de falha do app: cada jeito de uma chamada dar errado precisa virar
/// um código do catálogo e uma mensagem legível — nunca o texto do Dio.
void main() {
  final req = RequestOptions(path: '/api/consultations');

  DioException dioErr(DioExceptionType type, {int? status, Object? data, Object? error}) =>
      DioException(
        requestOptions: req,
        type: type,
        error: error,
        response: status == null ? null : Response(requestOptions: req, statusCode: status, data: data),
      );

  group('ApiError.from — rede', () {
    test('servidor fora do ar (sem conexão)', () {
      final e = ApiError.from(dioErr(DioExceptionType.connectionError));
      expect(e.code, 'REDE_SEM_CONEXAO');
      expect(e.isNetwork, isTrue);
      expect(e.message, 'Sem conexão com a internet.');
    });

    test('timeout de conexão, envio e resposta', () {
      for (final t in [
        DioExceptionType.connectionTimeout,
        DioExceptionType.sendTimeout,
        DioExceptionType.receiveTimeout,
      ]) {
        expect(ApiError.from(dioErr(t)).code, 'REDE_TEMPO_ESGOTADO', reason: '$t');
      }
    });

    test('SocketException vinda como erro desconhecido', () {
      final e = ApiError.from(dioErr(DioExceptionType.unknown, error: 'SocketException: Failed host lookup'));
      expect(e.code, 'REDE_SEM_CONEXAO');
    });
  });

  group('ApiError.from — respostas do servidor', () {
    test('usa code e message do catálogo', () {
      final e = ApiError.from(dioErr(
        DioExceptionType.badResponse,
        status: 409,
        data: {'code': 'AGENDA_HORARIO_OCUPADO', 'message': 'Esse horário acabou de ser ocupado. Escolha outro.'},
      ));
      expect(e.code, 'AGENDA_HORARIO_OCUPADO');
      expect(e.statusCode, 409);
      expect(e.message, contains('ocupado'));
    });

    test('erros por campo (zod)', () {
      final e = ApiError.from(dioErr(
        DioExceptionType.badResponse,
        status: 422,
        data: {
          'code': 'DADOS_INVALIDOS',
          'message': 'Alguns campos estão inválidos.',
          'errors': {'weightKg': ['O peso deve ser maior que 20 kg']},
        },
      ));
      expect(e.firstFieldError, 'O peso deve ser maior que 20 kg');
    });

    test('401 é sessão expirada, com ou sem corpo', () {
      expect(
        ApiError.from(dioErr(DioExceptionType.badResponse, status: 401, data: {'code': 'AUTH_SESSAO_EXPIRADA'})).isSessionExpired,
        isTrue,
      );
      expect(ApiError.from(dioErr(DioExceptionType.badResponse, status: 401, data: '')).isSessionExpired, isTrue);
    });

    test('página HTML no lugar do JSON (erro da Vercel)', () {
      final e = ApiError.from(dioErr(DioExceptionType.badResponse, status: 504, data: '<html>Gateway Timeout</html>'));
      expect(e.code, 'SERVIDOR_RESPOSTA_INVALIDA');
      expect(e.message, isNot(contains('<html>')));
    });

    test('mensagem de fallback quando o servidor não manda nenhuma', () {
      final e = ApiError.from(
        dioErr(DioExceptionType.badResponse, status: 500, data: <String, dynamic>{}),
        fallback: 'Não foi possível carregar o chat.',
      );
      expect(e.message, 'Não foi possível carregar o chat.');
    });
  });

  group('ApiError.from — erros do próprio app', () {
    test('TypeError ao ler resposta em formato inesperado', () {
      Object? caught;
      try {
        final dynamic data = '<html></html>';
        // ignore: avoid_dynamic_calls
        data['data']['data'];
      } catch (e) {
        caught = e;
      }
      expect(ApiError.from(caught!).code, 'SERVIDOR_RESPOSTA_INVALIDA');
    });

    test('ApiError passa intacto', () {
      const original = ApiError('CONSULTA_ENCERRADA', 'Esta consulta já foi encerrada.');
      expect(identical(ApiError.from(original), original), isTrue);
    });
  });

  group('Falhas dos serviços', () {
    test('ConsultationFailure.isSlotTaken pelo código', () {
      final f = ConsultationFailure.fromError(
        dioErr(DioExceptionType.badResponse, status: 409, data: {'code': 'AGENDA_HORARIO_OCUPADO', 'message': 'x'}),
        fallback: 'y',
      );
      expect(f.isSlotTaken, isTrue);

      final indisponivel = ConsultationFailure.fromError(
        dioErr(DioExceptionType.badResponse, status: 409, data: {'code': 'AGENDA_MEDICO_INDISPONIVEL', 'message': 'x'}),
        fallback: 'y',
      );
      expect(indisponivel.isSlotTaken, isFalse);
    });

    test('DoctorFailure.isNotApproved pelo código', () {
      final f = DoctorFailure.fromError(
        dioErr(DioExceptionType.badResponse, status: 403, data: {'code': 'MEDICO_EM_ANALISE', 'message': 'x'}),
        fallback: 'y',
      );
      expect(f.isNotApproved, isTrue);
    });

    test('sem rede o serviço devolve mensagem legível', () {
      final f = ConsultationFailure.fromError(
        dioErr(DioExceptionType.connectionError),
        fallback: 'Não foi possível agendar a consulta.',
      );
      expect(f.code, 'REDE_SEM_CONEXAO');
      expect(f.message, isNot(contains('DioException')));
    });
  });
}
