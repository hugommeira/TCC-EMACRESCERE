import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:postgres/postgres.dart';

class DatabaseService {
  DatabaseService._();

  static Connection? _connection;

  static Future<Connection> get connection async {
    final current = _connection;
    if (current != null && current.isOpen) {
      return current;
    }

    final url = dotenv.env['DATABASE_URL'];
    if (url == null || url.isEmpty) {
      throw StateError('DATABASE_URL não definida no .env');
    }

    final uri = Uri.parse(url);
    final userInfo = uri.userInfo.split(':');

    final opened = await Connection.open(
      Endpoint(
        host: uri.host,
        port: uri.hasPort ? uri.port : 5432,
        database: uri.path.replaceFirst('/', ''),
        username: Uri.decodeComponent(userInfo[0]),
        password: Uri.decodeComponent(userInfo[1]),
      ),
      settings: const ConnectionSettings(sslMode: SslMode.require),
    );

    _connection = opened;
    return opened;
  }

  static Future<void> close() async {
    await _connection?.close();
    _connection = null;
  }
}
