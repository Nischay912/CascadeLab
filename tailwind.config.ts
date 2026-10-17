import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        surface: {
          DEFAULT: '#111A2E',
          raised: '#162240',
          hover: '#1C2B52',
        },
        border: {
          DEFAULT: '#1F2A44',
          subtle: '#172238',
          accent: '#2B3D66',
        },
        text: {
          primary: '#E6EAF2',
          muted: '#8A96B0',
          dim: '#556582',
        },
        accent: {
          DEFAULT: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.15)',
        },
        status: {
          healthy: '#34D399',
          degraded: '#FBBF24',
          failing: '#F87171',
          down: '#6B7280',
          recovering: '#60A5FA',
        },
        traffic: {
          normal: '#22D3EE',
          retry: '#FB923C',
          error: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        noc: '0 4px 20px -2px rgba(11, 16, 32, 0.8), 0 0 15px 0 rgba(56, 189, 248, 0.05)',
        'noc-glow': '0 0 25px rgba(56, 189, 248, 0.2)',
        'fail-glow': '0 0 25px rgba(248, 113, 113, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
