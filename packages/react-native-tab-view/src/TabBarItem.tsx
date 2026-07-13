import * as React from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Platform,
  type PressableAndroidRippleConfig,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import useLatestCallback from 'use-latest-callback';

import { PlatformPressable } from './PlatformPressable';
import { TabBarItemLabel } from './TabBarItemLabel';
import type {
  AnimatedStyles,
  NavigationState,
  Route,
  TabDescriptor,
} from './types';

export type Props<T extends Route> = TabDescriptor<T> & {
  position: Animated.AnimatedInterpolation<number>;
  route: T;
  navigationState: NavigationState<T>;
  pressColor?: string;
  pressOpacity?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
  onPress: () => void;
  onLongPress: () => void;
  defaultTabWidth?: number;
  style: StyleProp<ViewStyle>;
  android_ripple?: PressableAndroidRippleConfig;
  animatedStyles?: AnimatedStyles;
};

const DEFAULT_ACTIVE_COLOR = 'rgba(255, 255, 255, 1)';
const DEFAULT_INACTIVE_COLOR = 'rgba(255, 255, 255, 0.7)';
const ICON_SIZE = 24;

type TabBarItemInternalProps<T extends Route> = Omit<
  Props<T>,
  | 'navigationState'
  | 'getAccessibilityLabel'
  | 'getLabelText'
  | 'getTestID'
  | 'getAccessible'
  | 'options'
> & {
  isFocused: boolean;
  index: number;
  routesLength: number;
} & TabDescriptor<T>;

const ANDROID_RIPPLE_DEFAULT = { borderless: true };

const TabBarItemInternal = <T extends Route>({
  accessibilityLabel,
  accessible,
  label: customlabel,
  testID,
  onLongPress,
  onPress,
  isFocused,
  position,
  style,
  labelStyle,
  onLayout,
  index: tabIndex,
  pressColor,
  pressOpacity,
  defaultTabWidth,
  icon: customIcon,
  badge: customBadge,
  href,
  labelText,
  routesLength,
  android_ripple = ANDROID_RIPPLE_DEFAULT,
  labelAllowFontScaling,
  route,
  animatedStyles,
}: TabBarItemInternalProps<T>) => {
  const inputRange = React.useMemo(
    () =>
      routesLength >= 2
        ? Array.from({ length: routesLength }, (_, i) => i)
        : [0, 1],
    [routesLength]
  );
  const labelColorFromStyle = StyleSheet.flatten(labelStyle || {}).color;

  const activeColor = animatedStyles?.color
    ? animatedStyles?.color[1]
    : typeof labelColorFromStyle === 'string'
      ? labelColorFromStyle
      : DEFAULT_ACTIVE_COLOR;
  const inactiveColor = animatedStyles?.color
    ? animatedStyles?.color[0]
    : typeof labelColorFromStyle === 'string'
      ? labelColorFromStyle
      : DEFAULT_INACTIVE_COLOR;

  const ReAnimatedProgress = useSharedValue(isFocused ? 1 : 0);

  React.useEffect(() => {
    const listenerId = position.addListener(({ value }) => {
      const progress =
        Math.abs(tabIndex - value) > 1 ? 0 : 1 - Math.abs(tabIndex - value);
      ReAnimatedProgress.value = progress;
    });
    return () => {
      position.removeListener(listenerId);
    };
  }, [position, ReAnimatedProgress, tabIndex, route.key]);

  const ReAnimatedStyleRef = React.useRef(
    useAnimatedStyle(() => {
      const color = interpolateColor(
        ReAnimatedProgress.value,
        [0, 1],
        [inactiveColor, activeColor]
      );
      return { color };
    }, [ReAnimatedProgress, activeColor, inactiveColor])
  );

  const opacity = animatedStyles?.opacity
    ? position.interpolate({
        inputRange,
        outputRange: inputRange.map((i) =>
          i === tabIndex
            ? animatedStyles.opacity![1]
            : animatedStyles.opacity![0]
        ),
        extrapolate: 'clamp',
      })
    : 1;

  const scale = animatedStyles?.scale
    ? position.interpolate({
        inputRange,
        outputRange: inputRange.map((i) =>
          i === tabIndex ? animatedStyles.scale![1] : animatedStyles.scale![0]
        ),
        extrapolate: 'clamp',
      })
    : 1;

  const icon = React.useMemo(() => {
    if (!customIcon) {
      return null;
    }

    const iconEle = customIcon({
      focused: isFocused,
      color: ReAnimatedStyleRef.current.color,
      size: ICON_SIZE,
      route,
    });

    return (
      <View style={styles.icon}>
        <Animated.View style={{ opacity }}>{iconEle}</Animated.View>
      </View>
    );
  }, [route, customIcon, isFocused, ReAnimatedStyleRef, opacity]);

  const renderLabel = React.useCallback(
    () =>
      customlabel ? (
        customlabel({
          focused: isFocused,
          style: labelStyle,
          animatedStyles: ReAnimatedStyleRef.current,
          labelText,
          allowFontScaling: labelAllowFontScaling,
          route,
        })
      ) : (
        <TabBarItemLabel
          icon={icon}
          label={labelText}
          style={labelStyle}
          animatedStyles={ReAnimatedStyleRef.current}
          labelAllowFontScaling={labelAllowFontScaling}
        />
      ),
    [
      customlabel,
      labelStyle,
      labelText,
      labelAllowFontScaling,
      route,
      icon,
      isFocused,
      ReAnimatedStyleRef,
    ]
  );

  const tabStyle = StyleSheet.flatten(style);
  const isWidthSet = tabStyle?.width !== undefined;

  const tabContainerStyle: ViewStyle | null = isWidthSet
    ? null
    : { width: defaultTabWidth };

  const ariaLabel =
    typeof accessibilityLabel !== 'undefined' ? accessibilityLabel : labelText;

  return (
    <PlatformPressable
      android_ripple={android_ripple}
      testID={testID}
      accessible={accessible}
      role="tab"
      aria-label={ariaLabel}
      aria-selected={isFocused}
      pressColor={pressColor}
      pressOpacity={pressOpacity}
      unstable_pressDelay={0}
      onLayout={onLayout}
      onPress={onPress}
      onLongPress={onLongPress}
      href={href}
      style={[styles.pressable, tabContainerStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.item, tabStyle, { opacity, transform: [{ scale }] }]}
      >
        {icon}
        <View>{renderLabel()}</View>
        {customBadge != null ? (
          <View style={styles.badge}>{customBadge({ route })}</View>
        ) : null}
      </Animated.View>
    </PlatformPressable>
  );
};

const MemoizedTabBarItemInternal = React.memo(
  TabBarItemInternal
) as typeof TabBarItemInternal;

export function TabBarItem<T extends Route>(props: Props<T>) {
  const { onPress, onLongPress, onLayout, navigationState, route, ...rest } =
    props;

  const onPressLatest = useLatestCallback(onPress);
  const onLongPressLatest = useLatestCallback(onLongPress);
  const onLayoutLatest = useLatestCallback(onLayout ? onLayout : () => {});

  const tabIndex = navigationState.routes.indexOf(route);

  return (
    <MemoizedTabBarItemInternal
      {...rest}
      onPress={onPressLatest}
      onLayout={onLayoutLatest}
      onLongPress={onLongPressLatest}
      isFocused={navigationState.index === tabIndex}
      route={route}
      index={tabIndex}
      routesLength={navigationState.routes.length}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    margin: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    minHeight: 48,
  },
  badge: {
    position: 'absolute',
    top: 0,
    end: 0,
  },
  pressable: {
    // The label is not pressable on Windows
    // Adding backgroundColor: 'transparent' seems to fix it
    backgroundColor: 'transparent',
    ...Platform.select({
      // Roundness for iPad hover effect
      ios: {
        borderRadius: 10,
        borderCurve: 'continuous',
      },
      default: null,
    }),
  },
});
