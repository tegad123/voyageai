import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { DailyPlan } from '../context/ItineraryContext';
import ItineraryList from './ItineraryList';
import { format, parseISO } from 'date-fns';
import { log } from '../utils/log';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  plans: DailyPlan[];
}

const ItineraryTabs: React.FC<Props> = ({ plans }) => {
  log('[TABS] days =', plans.length);
  const [selected, setSelected] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useLanguage();

  // Reset scroll position to top whenever a new day is selected
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selected]);

  // Log layout metrics to debug mysterious gap
  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    console.log('[TABS] container layout', e.nativeEvent.layout);
  }, []);

  const handleScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    console.log('[TABS] scrollView layout', e.nativeEvent.layout);
  }, []);

  const handleContentSizeChange = useCallback((w: number, h: number) => {
    console.log('[TABS] content size change', { width: w, height: h });
  }, []);

  if (plans.length === 0) {
    return <Text style={{ color: '#999', textAlign: 'center' }}>No itinerary yet</Text>;
  }

  const selectedPlan = plans[selected] ?? plans[0];

  console.log('ItineraryTabs styles:', JSON.stringify(styles.tab, null, 2));

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {/* Tab bar */}
      <ScrollView
        style={styles.tabBarWrapper}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {plans.map((day, idx) => {
          const active = idx === selected;
          // Some itineraries have empty/invalid dates; avoid crashing on parse/format
          // We currently don't render the date in the tab label, so skip formatting entirely.
          return (
            <Pressable
              key={day.day}
              style={[styles.tab, active && styles.activeTab]}
              onPress={() => setSelected(idx)}
            >
              <Text style={[styles.tabText, active && styles.activeTabText]}>{t('Day')} {day.day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List for the selected day */}
      <ScrollView
        ref={scrollRef}
        style={styles.contentContainer}
        contentContainerStyle={styles.contentPad}
        contentInsetAdjustmentBehavior="never"
        contentInset={{ top: 0, bottom: 0 }}
        scrollIndicatorInsets={{ top: 0, bottom: 0 }}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>)=>console.log('[TABS] scroll offset', e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <ItineraryList plans={[selectedPlan]} hideDayHeaders />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  tabBarWrapper: {
    flexGrow: 0,
    height: 56,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    minWidth: 72,
    marginRight: 8,
    height: 44,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#6B5B95',
    borderColor: '#6B5B95',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentPad: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 0,
  },
});

export default ItineraryTabs; 