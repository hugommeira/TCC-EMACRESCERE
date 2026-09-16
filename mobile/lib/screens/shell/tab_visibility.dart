import 'package:flutter/material.dart';

import 'main_shell.dart';

/// Mixin pra telas que vivem numa aba do [MainShell]: chama [onTabShown]
/// toda vez que a aba volta a ficar visível (não na primeira vez — o
/// initState da tela já carrega os dados).
mixin TabVisibilityMixin<T extends StatefulWidget> on State<T> {
  ShellTab get tab;
  bool _wasVisible = true;

  /// Chamado quando a aba sai de "escondida" pra "visível".
  void onTabShown();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final current = ShellTabScope.maybeOf(context)?.current;
    if (current == null) return;
    final visible = current == tab;
    if (visible && !_wasVisible) onTabShown();
    _wasVisible = visible;
  }
}
