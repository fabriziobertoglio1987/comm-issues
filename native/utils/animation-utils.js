// @flow

import * as React from 'react';
import { Platform } from 'react-native';
import { State as GestureState } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';

import type { Shape } from 'lib/types/core';

/* eslint-disable import/no-named-as-default-member */
const {
  Clock,
  Value,
  block,
  cond,
  not,
  and,
  or,
  greaterThan,
  lessThan,
  eq,
  neq,
  add,
  sub,
  multiply,
  divide,
  abs,
  set,
  max,
  startClock,
  stopClock,
  clockRunning,
  timing,
  spring,
  SpringUtils,
} = Animated;
/* eslint-enable import/no-named-as-default-member */

function clamp(value: Value, minValue: Value, maxValue: Value): Value {
  return cond(
    greaterThan(value, maxValue),
    maxValue,
    cond(greaterThan(minValue, value), minValue, value),
  );
}

function dividePastDistance(
  value: Value,
  distance: number,
  factor: number,
): Value {
  const absValue = abs(value);
  const absFactor = cond(eq(absValue, 0), 1, divide(value, absValue));
  return cond(
    lessThan(absValue, distance),
    value,
    multiply(add(distance, divide(sub(absValue, distance), factor)), absFactor),
  );
}

function delta(value: Value) {
  const prevValue = new Value(0);
  const deltaValue = new Value(0);
  return [
    set(deltaValue, cond(eq(prevValue, 0), 0, sub(value, prevValue))),
    set(prevValue, value),
    deltaValue,
  ];
}

function gestureJustStarted(state: Value) {
  const prevValue = new Value(-1);
  return cond(eq(prevValue, state), 0, [
    set(prevValue, state),
    eq(state, GestureState.ACTIVE),
  ]);
}

function gestureJustEnded(state: Value) {
  const prevValue = new Value(-1);
  return cond(eq(prevValue, state), 0, [
    set(prevValue, state),
    eq(state, GestureState.END),
  ]);
}

const defaultTimingConfig = {
  duration: 250,
  easing: Easing.out(Easing.ease),
};

type TimingConfig = Shape<typeof defaultTimingConfig>;
function runTiming(
  clock: Clock,
  initialValue: Value | number,
  finalValue: Value | number,
  startStopClock: boolean = true,
  config: TimingConfig = defaultTimingConfig,
): Value {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  };
  const timingConfig = {
    ...defaultTimingConfig,
    ...config,
    toValue: new Value(0),
  };
  return [
    cond(not(clockRunning(clock)), [
      set(state.finished, 0),
      set(state.frameTime, 0),
      set(state.time, 0),
      set(state.position, initialValue),
      set(timingConfig.toValue, finalValue),
      startStopClock && startClock(clock),
    ]),
    timing(clock, state, timingConfig),
    cond(state.finished, startStopClock && stopClock(clock)),
    state.position,
  ];
}

const defaultSpringConfig = SpringUtils.makeDefaultConfig();

type SpringConfig = Shape<typeof defaultSpringConfig>;
type SpringAnimationInitialState = Shape<{|
  +velocity: Value | number,
|}>;
function runSpring(
  clock: Clock,
  initialValue: Value | number,
  finalValue: Value | number,
  startStopClock: boolean = true,
  config: SpringConfig = defaultSpringConfig,
  initialState?: SpringAnimationInitialState,
): Value {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    velocity: new Value(0),
    time: new Value(0),
  };
  const springConfig = {
    ...defaultSpringConfig,
    ...config,
    toValue: new Value(0),
  };
  return [
    cond(not(clockRunning(clock)), [
      set(state.finished, 0),
      set(state.velocity, initialState?.velocity ?? 0),
      set(state.time, 0),
      set(state.position, initialValue),
      set(springConfig.toValue, finalValue),
      startStopClock && startClock(clock),
    ]),
    spring(clock, state, springConfig),
    cond(state.finished, startStopClock && stopClock(clock)),
    state.position,
  ];
}

// You provide a node that performs a "ratchet",
// and this function will call it as keyboard height increases
function ratchetAlongWithKeyboardHeight(
  keyboardHeight: Animated.Node,
  ratchetFunction: Animated.Node,
) {
  const prevKeyboardHeightValue = new Value(-1);
  const whenToUpdate = Platform.select({
    // In certain situations, iOS will send multiple keyboardShows in rapid
    // succession with increasing height values. Only the final value has any
    // semblance of reality. I've encountered this when using the native
    // password management integration
    ios: greaterThan(keyboardHeight, max(prevKeyboardHeightValue, 0)),
    // Android's keyboard can resize due to user interaction sometimes. In these
    // cases it can get quite big, in which case we don't want to update
    default: and(
      eq(prevKeyboardHeightValue, 0),
      greaterThan(keyboardHeight, 0),
    ),
  });
  const whenToReset = and(
    eq(keyboardHeight, 0),
    greaterThan(prevKeyboardHeightValue, 0),
  );
  return block([
    cond(
      lessThan(prevKeyboardHeightValue, 0),
      set(prevKeyboardHeightValue, keyboardHeight),
    ),
    cond(or(whenToUpdate, whenToReset), ratchetFunction),
    set(prevKeyboardHeightValue, keyboardHeight),
  ]);
}

function useReanimatedValueForBoolean(booleanValue: boolean): Value {
  const reanimatedValueRef = React.useRef();
  if (!reanimatedValueRef.current) {
    reanimatedValueRef.current = new Value(booleanValue ? 1 : 0);
  }
  React.useEffect(() => {
    reanimatedValueRef.current?.setValue(booleanValue ? 1 : 0);
  }, [booleanValue]);
  return reanimatedValueRef.current;
}

// Target can be either 0 or 1. Caller handles interpolating
function animateTowards(
  target: Value,
  fullAnimationLength: number, // in ms
): Value {
  const curValue = new Value(-1);
  const prevTarget = new Value(-1);
  const clock = new Clock();

  const prevClockValue = new Value(0);
  const curDeltaClockValue = new Value(0);
  const deltaClockValue = [
    set(
      curDeltaClockValue,
      cond(eq(prevClockValue, 0), 0, sub(clock, prevClockValue)),
    ),
    set(prevClockValue, clock),
    curDeltaClockValue,
  ];
  const progressPerFrame = divide(deltaClockValue, fullAnimationLength);

  return block([
    [
      cond(eq(curValue, -1), set(curValue, target)),
      cond(eq(prevTarget, -1), set(prevTarget, target)),
    ],
    cond(neq(target, prevTarget), [stopClock(clock), set(prevTarget, target)]),
    cond(neq(curValue, target), [
      cond(not(clockRunning(clock)), [
        set(prevClockValue, 0),
        startClock(clock),
      ]),
      set(
        curValue,
        cond(
          eq(target, 1),
          add(curValue, progressPerFrame),
          sub(curValue, progressPerFrame),
        ),
      ),
    ]),
    [
      cond(greaterThan(curValue, 1), set(curValue, 1)),
      cond(lessThan(curValue, 0), set(curValue, 0)),
    ],
    cond(eq(curValue, target), [stopClock(clock)]),
    curValue,
  ]);
}

export {
  clamp,
  dividePastDistance,
  delta,
  gestureJustStarted,
  gestureJustEnded,
  runTiming,
  runSpring,
  ratchetAlongWithKeyboardHeight,
  useReanimatedValueForBoolean,
  animateTowards,
};
