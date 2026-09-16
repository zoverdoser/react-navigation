import { expect, jest, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import { Animated, View } from 'react-native';
import { setUpTests } from 'react-native-reanimated';

import { TabBar } from '../TabBar';
import { TabBarItem } from '../TabBarItem';
import type { AnimatedStyles } from '../types';

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock')
);

setUpTests();

jest.useFakeTimers();

const routes = [
  { key: 'first', title: 'First' },
  { key: 'second', title: 'Second' },
];

test('uses fixed-size interpolation ranges and reuses the animated nodes', () => {
  const position = new Animated.Value(0);
  const interpolate = jest.spyOn(position, 'interpolate');
  const renderItem = (index: number) => (
    <TabBarItem
      position={position as unknown as Animated.AnimatedInterpolation<number>}
      route={routes[0]}
      navigationState={{ index, routes }}
      onPress={jest.fn()}
      onLongPress={jest.fn()}
      style={undefined}
      icon={() => <View />}
      animatedStyles={{ opacity: [0.5, 1], scale: [0.9, 1] }}
    />
  );

  const { rerender } = render(renderItem(0));

  expect(interpolate).toHaveBeenCalledTimes(4);
  for (const [config] of interpolate.mock.calls) {
    expect(config.inputRange).toEqual([-1, 0, 1]);
    expect(config.outputRange).toHaveLength(3);
  }

  rerender(renderItem(1));

  expect(interpolate).toHaveBeenCalledTimes(4);
});

test('keeps animatedStyles stable when an equivalent inline object is passed', () => {
  const position = new Animated.Value(0);
  const receivedStyles: (AnimatedStyles | undefined)[] = [];
  const renderTabBarItem = ({
    key,
    animatedStyles,
  }: {
    key: string;
    animatedStyles?: AnimatedStyles;
  }) => {
    if (key === routes[0].key) {
      receivedStyles.push(animatedStyles);
    }

    return <View />;
  };
  const jumpTo = jest.fn();
  const renderTabBar = (index: number) => (
    <TabBar
      position={position as unknown as Animated.AnimatedInterpolation<number>}
      layout={{ width: 320, height: 48 }}
      jumpTo={jumpTo}
      navigationState={{ index, routes }}
      renderTabBarItem={renderTabBarItem}
      animatedStyles={{
        color: ['gray', 'black'],
        opacity: [0.5, 1],
        scale: [0.9, 1],
      }}
    />
  );

  const { rerender } = render(renderTabBar(0));
  act(() => jest.runAllTimers());
  const firstStyles = receivedStyles.at(-1);
  const firstRenderCount = receivedStyles.length;

  expect(firstStyles).toEqual({
    color: ['gray', 'black'],
    opacity: [0.5, 1],
    scale: [0.9, 1],
  });

  rerender(renderTabBar(1));
  act(() => jest.runAllTimers());

  expect(receivedStyles.length).toBeGreaterThan(firstRenderCount);
  expect(receivedStyles.at(-1)).toBe(firstStyles);
});
