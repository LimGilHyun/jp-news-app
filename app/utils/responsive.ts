import { useWindowDimensions } from 'react-native';

export interface Responsive {
  width: number;
  height: number;
  isCompact: boolean;     // 작은 폰 (iPhone SE 등)
  isTablet: boolean;      // 태블릿 / 폴더블 펼침
  contentMaxWidth: number; // 본문 영역 최대 너비
  hPadding: number;        // 가로 패딩
  fontScale: number;       // 폰트 스케일 (0.92~1.05)
  heroHeight: number;      // 기사 상세 히어로 이미지 높이
  popupWidth: number;      // 단어 팝업 너비
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const isCompact = width < 360;
  const isTablet = width >= 720;

  // 본문은 태블릿에서 너무 넓게 늘어나지 않도록 600dp 캡
  const contentMaxWidth = isTablet ? 640 : width;
  const hPadding = isCompact ? 12 : isTablet ? 24 : 16;
  const fontScale = isCompact ? 0.92 : isTablet ? 1.04 : 1;
  // 히어로 이미지는 16:9 비율, 단 너무 크지 않게 320dp 상한
  const heroHeight = Math.min(Math.round(width * 0.5625), isTablet ? 360 : 320);
  // 팝업은 화면 폭의 50%, 130~220dp 범위
  const popupWidth = Math.max(130, Math.min(220, Math.round(width * 0.5)));

  return {
    width,
    height,
    isCompact,
    isTablet,
    contentMaxWidth,
    hPadding,
    fontScale,
    heroHeight,
    popupWidth,
  };
}

export function rf(size: number, scale: number): number {
  // 폰트 사이즈 반올림 정수 변환
  return Math.round(size * scale);
}
