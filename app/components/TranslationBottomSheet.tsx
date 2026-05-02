import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { Token } from '../types/article';

interface Props {
  token: Token | null;
}

const POS_LABELS: Record<Token['pos'], string> = {
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  particle: '조사',
  symbol: '기호',
  other: '기타',
};

export const TranslationBottomSheet = forwardRef<BottomSheetModal, Props>(
  function TranslationBottomSheet({ token }, ref) {
    const snapPoints = useMemo(() => ['30%'], []);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
      >
        <BottomSheetView style={styles.container}>
          {token ? (
            <>
              <View style={styles.row}>
                <Text style={styles.surface}>{token.surface}</Text>
                <Text style={styles.posBadge}>{POS_LABELS[token.pos]}</Text>
              </View>
              {token.reading.length > 0 && (
                <Text style={styles.reading}>발음: {token.reading}</Text>
              )}
              <Text style={styles.meaning}>{token.meaning}</Text>
            </>
          ) : (
            <Text style={styles.empty}>선택된 단어가 없습니다.</Text>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  surface: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
  },
  posBadge: {
    fontSize: 12,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  reading: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
  },
  meaning: {
    fontSize: 18,
    color: '#0f172a',
    lineHeight: 26,
  },
  empty: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 24,
  },
});
