import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 80 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Main airplane body */}
        <Path
          d="M50 20 L75 45 L75 55 L50 50 L25 55 L25 45 Z"
          fill="url(#airplaneGradient)"
          stroke="#6B5B95"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Airplane wings */}
        <Path
          d="M30 40 L20 35 L15 40 L25 45 Z"
          fill="url(#wingGradient)"
          stroke="#6B5B95"
          strokeWidth="1.5"
        />
        
        <Path
          d="M70 40 L80 35 L85 40 L75 45 Z"
          fill="url(#wingGradient)"
          stroke="#6B5B95"
          strokeWidth="1.5"
        />
        
        {/* Airplane tail */}
        <Path
          d="M50 20 L45 10 L55 10 Z"
          fill="url(#tailGradient)"
          stroke="#6B5B95"
          strokeWidth="1.5"
        />
        
        {/* Motion trail/swoosh */}
        <Path
          d="M15 50 Q35 45 50 50 Q65 55 85 50"
          stroke="url(#trailGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        
        {/* Windows */}
        <Circle cx="40" cy="42" r="2" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="50" cy="42" r="2" fill="#FFFFFF" opacity="0.9" />
        <Circle cx="60" cy="42" r="2" fill="#FFFFFF" opacity="0.9" />
        
        {/* Gradient definitions */}
        <Defs>
          <LinearGradient id="airplaneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8E7CC3" />
            <Stop offset="50%" stopColor="#6B5B95" />
            <Stop offset="100%" stopColor="#5A4B7C" />
          </LinearGradient>
          
          <LinearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8E7CC3" />
            <Stop offset="100%" stopColor="#6B5B95" />
          </LinearGradient>
          
          <LinearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#8E7CC3" />
            <Stop offset="100%" stopColor="#6B5B95" />
          </LinearGradient>
          
          <LinearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8E7CC3" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#6B5B95" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#8E7CC3" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
      </Svg>
    </View>
  );
};

export default Logo; 