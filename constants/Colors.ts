const purple = '#6B5B95';
const tintColorLight = purple;
const tintColorDark = '#fff';

export default {
  light: {
    text: '#121212',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    whiteToLavender: ['#FFFFFF', '#F6F4FF'] as [string,string],
  },
  dark: {
    text: '#fff',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#666',
    tabIconSelected: tintColorDark,
    whiteToLavender: ['#FFFFFF', '#F6F4FF'] as [string,string],
  },
}; 