import React, { Component } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches uncaught JS errors in the component tree and shows a recovery screen.
 * Wraps the entire app in _layout.tsx.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={56} color="#E74C3C" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            JawEase hit an unexpected error. Your data is safe.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug} numberOfLines={6}>
              {this.state.error.message}
            </Text>
          )}
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAF9',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B2A',
    marginTop: 16,
  },
  body: {
    fontSize: 15,
    color: '#6B7C7B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  debug: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#3A7D6E',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
