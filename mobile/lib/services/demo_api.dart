import 'package:dio/dio.dart';

/// MODO DEMONSTRAÇÃO — só existe em build com `--dart-define=DEMO_API=true`.
///
/// Responde as chamadas da API dentro do próprio app, com dados de exemplo
/// em memória (somem ao recarregar). Serve para mostrar e testar as telas
/// onde o app não alcança o backend (uma página publicada, um navegador sem
/// o proxy de dev). Nunca entra no app normal: o [ApiClient] só instala este
/// interceptor quando a chave está ligada.
///
/// Contas: mariana.castro@email.com (paciente) e
/// fernanda.costa@demo.emacrescere.app (médica), senha Demo@12345.
class DemoApi extends Interceptor {
  DemoApi() {
    _seed();
  }

  static const _password = 'Demo@12345';

  static const _patient = {
    'id': 'pat1',
    'name': 'Mariana Castro',
    'email': 'mariana.castro@email.com',
    'role': 'PATIENT',
    'image': null,
  };
  static const _doctor = {
    'id': 'doc1',
    'name': 'Dra. Fernanda Costa',
    'email': 'fernanda.costa@demo.emacrescere.app',
    'role': 'DOCTOR',
    'image': null,
  };

  Map<String, dynamic>? _me;

  final Map<String, dynamic> _doctorProfile = {
    'crm': '123456',
    'crmState': 'PE',
    'specialty': 'Endocrinologia',
    'subSpecialty': 'Obesidade',
    'bio': 'Acompanhamento de obesidade e doenças metabólicas.',
    'consultationFee': '250.00',
    'available': true,
    'approvalStatus': 'APPROVED',
    'crmVerification': {'situation': 'REGULAR'},
  };

  final List<Map<String, dynamic>> _consultations = [];
  final List<Map<String, dynamic>> _weights = [];
  final List<Map<String, dynamic>> _messages = [];
  double? _goal = 75;
  double? _height = 165;
  int _seq = 100;

  static String _iso(DateTime d) => d.toUtc().toIso8601String();

  /// Hoje + [days], às [hour] no horário de Brasília (UTC-3, como o site).
  static DateTime _at(int days, int hour) {
    final now = DateTime.now().toUtc();
    final d = DateTime.utc(now.year, now.month, now.day).add(Duration(days: days));
    return DateTime.utc(d.year, d.month, d.day, hour + 3);
  }

  Map<String, dynamic> _party(Map<String, dynamic> u) => {'id': u['id'], 'name': u['name'], 'image': null};

  void _seed() {
    final now = DateTime.now();
    _consultations.addAll([
      {
        'id': 'c1',
        'status': 'SCHEDULED',
        'createdAt': _iso(now.subtract(const Duration(days: 2))),
        'scheduledAt': _iso(_at(2, 10)),
        'chiefComplaint': 'Retorno: acompanhamento de peso',
        'roomToken': 'room1',
        'doctor': _party(_doctor),
        'patient': _party(_patient),
        'payment': {'id': 'p1', 'status': 'CONFIRMED', 'method': 'PIX', 'amount': '250.00'},
      },
      {
        'id': 'c2',
        'status': 'SCHEDULED',
        'createdAt': _iso(now.subtract(const Duration(days: 1))),
        'scheduledAt': _iso(_at(9, 15)),
        'chiefComplaint': 'Dúvidas sobre a dieta',
        'roomToken': 'room2',
        'doctor': _party(_doctor),
        'patient': _party(_patient),
        'payment': {'id': 'p2', 'status': 'PENDING', 'method': 'PIX', 'amount': '250.00'},
      },
      {
        'id': 'c3',
        'status': 'COMPLETED',
        'createdAt': _iso(now.subtract(const Duration(days: 40))),
        'scheduledAt': _iso(_at(-30, 9)),
        'startedAt': _iso(_at(-30, 9)),
        'endedAt': _iso(_at(-30, 9).add(const Duration(minutes: 40))),
        'chiefComplaint': 'Primeira consulta',
        'diagnosis': 'Obesidade grau I',
        'conduct': 'Reeducação alimentar e atividade física; retorno em 30 dias.',
        'roomToken': 'room3',
        'doctor': _party(_doctor),
        'patient': _party(_patient),
        'prescription': {'id': 'cmg4f7k2q9xademo0001', 'status': 'ISSUED', 'issuedAt': _iso(_at(-30, 10))},
        'payment': {'id': 'p3', 'status': 'RECEIVED', 'method': 'PIX', 'amount': '250.00'},
      },
      {
        'id': 'c4',
        'status': 'CANCELLED',
        'createdAt': _iso(now.subtract(const Duration(days: 20))),
        'scheduledAt': _iso(_at(-15, 14)),
        'chiefComplaint': 'Retorno',
        'roomToken': 'room4',
        'doctor': _party(_doctor),
        'patient': _party(_patient),
        'payment': {'id': 'p4', 'status': 'REFUNDED', 'method': 'PIX', 'amount': '250.00'},
      },
    ]);

    const ws = [92.4, 91.8, 91.1, 90.6, 90.0, 89.7, 89.1, 88.5];
    for (var i = 0; i < ws.length; i++) {
      final byDoctor = i == 2;
      _weights.add({
        'id': 'w$i',
        'measuredAt': _iso(now.subtract(Duration(days: (ws.length - 1 - i) * 10))),
        'weightKg': ws[i],
        'note': null,
        'source': byDoctor ? 'DOCTOR' : 'PATIENT',
        'recordedBy': byDoctor ? _doctor['name'] : null,
        'bmi': _bmi(ws[i]),
      });
    }

    _messages.addAll([
      {
        'id': 'm1',
        'content': 'Bom dia, Mariana! Como foi a semana com o novo plano?',
        'type': 'TEXT',
        'sender': {'id': 'doc1', 'name': _doctor['name'], 'role': 'DOCTOR'},
        'createdAt': _iso(now.subtract(const Duration(hours: 3))),
      },
      {
        'id': 'm2',
        'content': 'Bom dia, doutora! Consegui seguir quase todos os dias.',
        'type': 'TEXT',
        'sender': {'id': 'pat1', 'name': _patient['name'], 'role': 'PATIENT'},
        'createdAt': _iso(now.subtract(const Duration(hours: 2))),
      },
    ]);
  }

  /// Faixas da OMS só para os DADOS DE EXEMPLO (no app real o IMC vem pronto
  /// do servidor, lib/bmi.ts; as telas não calculam).
  Map<String, dynamic>? _bmi(double w) {
    final h = _height;
    if (h == null) return null;
    final v = double.parse((w / ((h / 100) * (h / 100))).toStringAsFixed(1));
    final (key, label) = v < 18.5
        ? ('UNDERWEIGHT', 'Abaixo do peso')
        : v < 25
        ? ('NORMAL', 'Peso normal')
        : v < 30
        ? ('OVERWEIGHT', 'Sobrepeso')
        : v < 35
        ? ('OBESE_1', 'Obesidade grau I')
        : v < 40
        ? ('OBESE_2', 'Obesidade grau II')
        : ('OBESE_3', 'Obesidade grau III');
    return {'value': v, 'category': key, 'label': label};
  }

  Map<String, dynamic> _summary() {
    final h = _height;
    final first = _weights.isEmpty ? null : _weights.first['weightKg'] as double;
    final last = _weights.isEmpty ? null : _weights.last['weightKg'] as double;
    final prev = _weights.length < 2 ? null : _weights[_weights.length - 2]['weightKg'] as double;
    return {
      'heightCm': h,
      'goalWeightKg': _goal,
      'healthyCeilingKg': h == null ? null : double.parse((24.9 * (h / 100) * (h / 100)).toStringAsFixed(1)),
      'deltaKg': first == null || last == null ? null : double.parse((last - first).toStringAsFixed(1)),
      'lastChangeKg': prev == null || last == null ? null : double.parse((last - prev).toStringAsFixed(1)),
      'count': _weights.length,
    };
  }

  Map<String, dynamic>? _find(String id) {
    for (final c in _consultations) {
      if (c['id'] == id) return c;
    }
    return null;
  }

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final o = options;
    final path = Uri.parse(o.path).path;
    final m = o.method.toUpperCase();
    final body = o.data is Map ? Map<String, dynamic>.from(o.data as Map) : <String, dynamic>{};

    void ok(Object? data, [int status = 200]) =>
        handler.resolve(Response(requestOptions: o, statusCode: status, data: data));
    void fail(int status, String message) => handler.reject(
      DioException(
        requestOptions: o,
        type: DioExceptionType.badResponse,
        response: Response(requestOptions: o, statusCode: status, data: {'message': message}),
      ),
    );

    // Uma resposta de rede não é instantânea; sem isso as animações de
    // carregamento nem aparecem.
    Future<void>.delayed(const Duration(milliseconds: 220), () {
      if (path == '/api/auth/csrf') return ok({'csrfToken': 'demo'});
      if (path == '/api/auth/callback/credentials') {
        final email = (body['email'] ?? '').toString().trim().toLowerCase();
        final user = email == _doctor['email'] ? _doctor : (email == _patient['email'] ? _patient : null);
        if (user == null || body['password'] != _password) return ok({'url': '/auth/login?error=CredentialsSignin'});
        _me = Map<String, dynamic>.from(user);
        return ok({'url': '/'});
      }
      if (path == '/api/auth/signout') {
        _me = null;
        return ok({'url': '/'});
      }
      if (path == '/api/auth/session') {
        return ok(
          _me == null
              ? <String, dynamic>{}
              : {'user': _me, 'expires': _iso(DateTime.now().add(const Duration(days: 1)))},
        );
      }
      if (path == '/api/users/register') {
        return fail(422, 'No modo demonstração não é possível criar contas. Use uma das contas de exemplo.');
      }

      final me = _me;
      if (me == null) return fail(401, 'Não autenticado');
      final isDoctor = me['role'] == 'DOCTOR';

      if (path == '/api/consultations' && m == 'GET') {
        return ok({
          'data': {'data': _consultations, 'total': _consultations.length, 'page': 1, 'limit': 50, 'pages': 1},
        });
      }
      if (path == '/api/consultations' && m == 'POST') {
        final c = {
          'id': 'c${_seq++}',
          'status': 'SCHEDULED',
          'createdAt': _iso(DateTime.now()),
          'scheduledAt': body['scheduledAt'],
          'chiefComplaint': body['chiefComplaint'],
          'roomToken': 'room$_seq',
          'doctor': _party(_doctor),
          'patient': _party(_patient),
          'payment': null,
        };
        _consultations.insert(0, c);
        return ok({'data': c}, 201);
      }

      final cm = RegExp(r'^/api/consultations/([^/]+)(?:/(\w+))?$').firstMatch(path);
      if (cm != null) {
        final c = _find(cm.group(1)!);
        if (c == null) return fail(404, 'Consulta não encontrada');
        switch (cm.group(2)) {
          case null:
            return ok({'data': c});
          case 'cancel':
            c['status'] = 'CANCELLED';
            return ok({'data': c});
          case 'status':
            c['status'] = body['status'];
            c['startedAt'] = _iso(DateTime.now());
            return ok({'data': c});
          case 'end':
            c['status'] = 'COMPLETED';
            c['endedAt'] = _iso(DateTime.now());
            return ok({'data': c});
          case 'prontuario':
            for (final k in ['diagnosis', 'conduct', 'notes']) {
              if (body.containsKey(k)) c[k] = body[k];
            }
            return ok({'data': c});
        }
      }

      if (path == '/api/users' && m == 'GET') {
        return ok({
          'data': {
            'data': [
              {..._doctor, 'doctorProfile': _doctorProfile},
            ],
            'total': 1,
            'page': 1,
            'limit': 20,
            'pages': 1,
          },
        });
      }
      if (RegExp(r'^/api/users/[^/]+$').hasMatch(path)) {
        if (isDoctor) {
          return ok({
            'data': {..._doctor, 'doctorProfile': _doctorProfile},
          });
        }
        return ok({
          'data': {
            ..._patient,
            'phone': '(81) 99999-0000',
            'cpf': '***.***.***-00',
            'patientProfile': {
              'birthDate': '1990-05-12T00:00:00.000Z',
              'gender': 'Feminino',
              'bloodType': 'O+',
              'allergies': ['Dipirona'],
              'medications': <String>[],
              'notes': null,
            },
          },
        });
      }

      final sm = RegExp(r'^/api/doctors/[^/]+/slots$').firstMatch(path);
      if (sm != null) {
        final date = (o.queryParameters['date'] ?? '').toString();
        final parts = date.split('-').map(int.tryParse).toList();
        if (parts.length != 3 || parts.contains(null)) {
          return ok({
            'data': {'slots': []},
          });
        }
        final day = DateTime.utc(parts[0]!, parts[1]!, parts[2]!);
        // Domingo sem atendimento; alguns horários ocupados; passado indisponível.
        if (day.weekday == DateTime.sunday) {
          return ok({
            'data': {'slots': []},
          });
        }
        final now = DateTime.now().toUtc();
        final slots = [
          for (final (i, h) in [8, 9, 10, 11, 14, 15, 16, 17].indexed)
            () {
              final starts = DateTime.utc(day.year, day.month, day.day, h + 3);
              final taken = _consultations.any((c) => c['scheduledAt'] == _iso(starts) && c['status'] != 'CANCELLED');
              return {
                'time': '${h.toString().padLeft(2, '0')}:00',
                'startsAt': _iso(starts),
                'available': !taken && starts.isAfter(now) && (i + day.day) % 3 != 1,
              };
            }(),
        ];
        return ok({
          'data': {'slots': slots},
        });
      }

      if (path == '/api/checkout') {
        final method = (body['method'] ?? 'PIX').toString();
        return ok({
          'data': {
            'id': 'pay${_seq++}',
            'status': 'PENDING',
            'method': method,
            'amount': '250.00',
            'pixCopyPaste': method == 'PIX' ? 'MODO-DEMONSTRACAO-PIX-NAO-PAGAR' : null,
            'pixQrCode': null,
            'boletoUrl': null,
          },
        });
      }
      if (path == '/api/dev/simulate-payment') return fail(404, 'Indisponível');

      if (path == '/api/weight' && m == 'GET') {
        return ok({
          'data': {'summary': _summary(), 'points': _weights},
        });
      }
      if (path == '/api/weight' && m == 'POST') {
        final w = (body['weightKg'] as num).toDouble();
        final entry = {
          'id': 'w${_seq++}',
          'measuredAt': body['measuredAt'] ?? _iso(DateTime.now()),
          'weightKg': w,
          'note': body['note'],
          'source': isDoctor ? 'DOCTOR' : 'PATIENT',
          'recordedBy': isDoctor ? _doctor['name'] : null,
          'bmi': _bmi(w),
        };
        _weights
          ..add(entry)
          ..sort((a, b) => (a['measuredAt'] as String).compareTo(b['measuredAt'] as String));
        return ok({'data': entry}, 201);
      }
      final wm = RegExp(r'^/api/weight/([^/]+)$').firstMatch(path);
      if (wm != null && m == 'DELETE') {
        _weights.removeWhere((w) => w['id'] == wm.group(1));
        return ok({'ok': true});
      }
      if (path == '/api/patient/metrics') {
        if (body.containsKey('heightCm')) _height = (body['heightCm'] as num?)?.toDouble();
        if (body.containsKey('goalWeightKg')) _goal = (body['goalWeightKg'] as num?)?.toDouble();
        for (final w in _weights) {
          w['bmi'] = _bmi(w['weightKg'] as double);
        }
        return ok({'data': _summary()});
      }

      if (path == '/api/doctor/profile') {
        if (m == 'PATCH' && body.containsKey('available')) _doctorProfile['available'] = body['available'];
        return ok({'profile': _doctorProfile});
      }

      final chat = RegExp(r'^/api/chat/[^/]+/(messages|read)$').firstMatch(path);
      if (chat != null) {
        if (chat.group(1) == 'read') return ok({'ok': true});
        if (m == 'POST') {
          final msg = {
            'id': 'm${_seq++}',
            'content': body['content'],
            'type': 'TEXT',
            'sender': {'id': me['id'], 'name': me['name'], 'role': me['role']},
            'createdAt': _iso(DateTime.now()),
          };
          _messages.add(msg);
          return ok({'data': msg}, 201);
        }
        return ok({'data': _messages});
      }

      if (path == '/api/queue/list') return ok({'items': <Object>[]});
      if (path.startsWith('/api/prescriptions/')) {
        return fail(404, 'No modo demonstração não há PDF de receita.');
      }

      return fail(404, 'Rota sem dados de demonstração: $path');
    });
  }
}
