import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Colors from '../constants/Colors';

console.log('=== [MenuRow] File loaded ===');

interface Props {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

console.log('=== [MenuRow] Before StyleSheet.create ===');
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  label: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
});
console.log('=== [MenuRow] StyleSheet created ===', styles);

export default function MenuRow({ icon, label, onPress }: Props) {
  console.log('=== [MenuRow] Render function called ===');
  console.log('=== [MenuRow] Styles:', styles);
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
      <View style={styles.left}>{icon}<Text style={styles.label}>{label}</Text></View>
      <ChevronRight size={20} color="#666" />
    </Pressable>
  );
} 