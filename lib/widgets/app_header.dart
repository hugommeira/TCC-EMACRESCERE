import 'package:flutter/material.dart';

import '../services/auth_service.dart';

/// Header verde curvo com avatar + saudação + badge, reutilizado em todas
/// as abas principais do app (mesmo estilo da Home).
class GreenHeader extends StatelessWidget {
  const GreenHeader({super.key, required this.user});

  final SessionUser? user;

  static const height = 140.0;
  static const overlap = 28.0;

  @override
  Widget build(BuildContext context) {
    final firstName = user?.name?.split(' ').first ?? '';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20 + overlap),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: Colors.white24,
            backgroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
            child: user?.image == null
                ? const Icon(Icons.person, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Olá,',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
                Text(
                  firstName.isEmpty ? '...' : firstName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Colors.white24,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }
}
