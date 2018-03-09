// @flow

import React from 'react';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { StackNavigator } from 'react-navigation';

import { MoreScreen, MoreScreenRouteName } from './more-screen.react';
import { EditEmail, EditEmailRouteName } from './edit-email.react';
import { EditPassword, EditPasswordRouteName } from './edit-password.react';
import { DeleteAccount, DeleteAccountRouteName } from './delete-account.react';
import { BuildInfo, BuildInfoRouteName } from './build-info.react';
import { DevTools, DevToolsRouteName } from './dev-tools.react';

const More = StackNavigator(
  {
    [MoreScreenRouteName]: { screen: MoreScreen },
    [EditEmailRouteName]: { screen: EditEmail },
    [EditPasswordRouteName]: { screen: EditPassword },
    [DeleteAccountRouteName]: { screen: DeleteAccount },
    [BuildInfoRouteName]: { screen: BuildInfo },
    [DevToolsRouteName]: { screen: DevTools },
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarLabel: 'More',
      tabBarIcon: ({ tintColor }) => (
        <Icon
          name="bars"
          style={[styles.icon, { color: tintColor }]}
        />
      ),
    }),
  },
);

const styles = StyleSheet.create({
  icon: {
    fontSize: 28,
  },
});

const MoreRouteName = 'More';
export {
  More,
  MoreRouteName,
};
