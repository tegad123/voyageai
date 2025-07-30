import React from 'react';
import { View, ViewStyle } from 'react-native';

console.log('=== [components/FadeInView.tsx] File loaded ===');

// Simple fallback FadeInView without reanimated to avoid Hermes HostFunction errors.
interface Props {
  children: React.ReactNode;
  delay?: number; // unused in this fallback
  style?: ViewStyle;
}

export default function FadeInView({ children, style }: Props) {
  return <View style={style}>{children}</View>;
} 