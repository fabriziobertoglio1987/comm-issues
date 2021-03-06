// @flow

import * as React from 'react';
import { View, Text } from 'react-native';

import Button from '../components/button.react';
import { useStyles } from '../themes/colors';

type Props = {|
  +onSave: () => void,
  +disabled: boolean,
|};
function CalendarInputBar(props: Props) {
  const styles = useStyles(unboundStyles);
  const inactiveStyle = props.disabled ? styles.inactiveContainer : undefined;
  return (
    <View
      style={[styles.container, inactiveStyle]}
      pointerEvents={props.disabled ? 'none' : 'auto'}
    >
      <Button onPress={props.onSave} iosActiveOpacity={0.5}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Button>
    </View>
  );
}

const unboundStyles = {
  container: {
    alignItems: 'flex-end',
    backgroundColor: 'listInputBar',
  },
  inactiveContainer: {
    opacity: 0,
  },
  saveButtonText: {
    color: 'link',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
    padding: 8,
  },
};

export default CalendarInputBar;
