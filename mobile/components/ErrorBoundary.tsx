import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={S.wrap}>
          <Text style={S.title}>Une erreur est survenue</Text>
          <Text style={S.sub}>Veuillez redémarrer l'application.</Text>
          <TouchableOpacity
            style={S.btn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={S.btnTxt}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const S = StyleSheet.create({
  wrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#eef1ee' },
  title:  { fontSize: 18, fontWeight: '800', color: '#1a2e1a', marginBottom: 8 },
  sub:    { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  btn:    { backgroundColor: '#22c55e', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: '#0f1419', fontSize: 15, fontWeight: '700' },
});
