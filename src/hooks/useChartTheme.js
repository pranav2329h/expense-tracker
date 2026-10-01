import { useMemo } from 'react';
import { useTheme } from './useTheme';

/*
 * Chart colours, validated for colour-vision deficiency in both modes (adjacent
 * pairs, first five slots). Categorical slots are always assigned in this order.
 * Income and expense keep slots 1 and 2 on every chart so they read consistently.
 */
const LIGHT = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  other: '#b5b4ab',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  axis: '#898781',
  surface: '#ffffff',
  cursor: 'rgba(11, 11, 11, 0.04)',
};

const DARK = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  other: '#5e5d58',
  grid: '#2c2c2a',
  baseline: '#383835',
  axis: '#898781',
  surface: '#1a1a19',
  cursor: 'rgba(255, 255, 255, 0.05)',
};

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  return useMemo(() => {
    const palette = resolvedTheme === 'dark' ? DARK : LIGHT;
    return { ...palette, income: palette.series[0], expense: palette.series[1] };
  }, [resolvedTheme]);
}
