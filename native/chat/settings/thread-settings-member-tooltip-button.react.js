// @flow

import * as React from 'react';
import { TouchableOpacity } from 'react-native';

import PencilIcon from '../../components/pencil-icon.react';
import type { AppNavigationProp } from '../../navigation/app-navigator.react';

type Props = {
  +navigation: AppNavigationProp<'ThreadSettingsMemberTooltipModal'>,
  ...
};
class ThreadSettingsMemberTooltipButton extends React.PureComponent<Props> {
  render() {
    return (
      <TouchableOpacity onPress={this.onPress}>
        <PencilIcon />
      </TouchableOpacity>
    );
  }

  onPress = () => {
    this.props.navigation.goBackOnce();
  };
}

export default ThreadSettingsMemberTooltipButton;
