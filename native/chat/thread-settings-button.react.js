// @flow

import * as React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import { type ThreadInfo } from 'lib/types/thread-types';

import Button from '../components/button.react';
import { ThreadSettingsRouteName } from '../navigation/route-names';
import { useStyles } from '../themes/colors';
import type { ChatNavigationProp } from './chat.react';

type BaseProps = {|
  +threadInfo: ThreadInfo,
  +navigate: $PropertyType<ChatNavigationProp<'MessageList'>, 'navigate'>,
|};
type Props = {|
  ...BaseProps,
  +styles: typeof unboundStyles,
|};

class ThreadSettingsButton extends React.PureComponent<Props> {
  render() {
    return (
      <Button onPress={this.onPress} androidBorderlessRipple={true}>
        <Icon name="md-settings" size={30} style={this.props.styles.button} />
      </Button>
    );
  }

  onPress = () => {
    const threadInfo = this.props.threadInfo;
    this.props.navigate({
      name: ThreadSettingsRouteName,
      params: { threadInfo },
      key: `${ThreadSettingsRouteName}${threadInfo.id}`,
    });
  };
}

const unboundStyles = {
  button: {
    color: 'link',
    paddingHorizontal: 10,
  },
};

export default React.memo<BaseProps>(function ConnectedThreadSettingsButton(
  props: BaseProps,
) {
  const styles = useStyles(unboundStyles);

  return <ThreadSettingsButton {...props} styles={styles} />;
});
