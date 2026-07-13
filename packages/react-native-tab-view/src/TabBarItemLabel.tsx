import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

interface TabBarItemLabelProps {
  label?: string;
  style: StyleProp<TextStyle>;
  animatedStyles: AnimatedStyle<TextStyle>;
  icon: React.ReactNode;
  labelAllowFontScaling?: boolean;
}

export const TabBarItemLabel = React.memo(
  ({
    label,
    style,
    animatedStyles,
    icon,
    labelAllowFontScaling,
  }: TabBarItemLabelProps) => {
    if (!label) {
      return null;
    }

    return (
      <Animated.Text
        style={[
          styles.label,
          icon ? { marginTop: 0 } : undefined,
          style,
          animatedStyles,
        ]}
        allowFontScaling={labelAllowFontScaling}
      >
        {label}
      </Animated.Text>
    );
  }
);

TabBarItemLabel.displayName = 'TabBarItemLabel';

const styles = StyleSheet.create({
  label: {
    margin: 4,
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
});
