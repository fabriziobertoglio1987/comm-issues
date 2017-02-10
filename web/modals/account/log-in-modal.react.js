// @flow

import type { AppState } from '../../redux-setup';
import type { DispatchActionPromise } from 'lib/utils/action-utils';

import React from 'react';
import invariant from 'invariant';
import { connect } from 'react-redux';
import update from 'immutability-helper';

import fetchJSON from 'lib/utils/fetch-json';
import {
  validUsernameRegex,
  validEmailRegex,
} from 'lib/shared/account-regexes';
import { includeDispatchActionProps } from 'lib/utils/action-utils';
import { logInActionType, logIn } from 'lib/actions/user-actions';
import { ServerError } from 'lib/utils/fetch-utils';
import { createLoadingStatusSelector } from 'lib/selectors/loading-selectors';

import css from '../../style.css';
import Modal from '../modal.react';
import ForgotPasswordModal from './forgot-password-modal.react';

type Props = {
  dispatchActionPromise: DispatchActionPromise,
  inputDisabled: bool,
  onClose: () => void,
  setModal: (modal: React.Element<any>) => void,
};
type State = {
  usernameOrEmail: string,
  password: string,
  errorMessage: string,
};

class LogInModal extends React.Component {

  props: Props;
  state: State;
  usernameOrEmailInput: ?HTMLInputElement;
  passwordInput: ?HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      usernameOrEmail: "",
      password: "",
      errorMessage: "",
    };
  }

  componentDidMount() {
    invariant(this.usernameOrEmailInput, "usernameOrEmail ref unset");
    this.usernameOrEmailInput.focus();
  }

  render() {
    return (
      <Modal name="Log in" onClose={this.props.onClose}>
        <div className={css['modal-body']}>
          <form method="POST">
            <div>
              <div className={css['form-title']}>Username</div>
              <div className={css['form-content']}>
                <input
                  type="text"
                  placeholder="Username or email"
                  value={this.state.usernameOrEmail}
                  onChange={this.onChangeUsernameOrEmail.bind(this)}
                  ref={(input) => this.usernameOrEmailInput = input}
                  disabled={this.props.inputDisabled}
                />
              </div>
            </div>
            <div>
              <div className={css['form-title']}>Password</div>
              <div className={css['form-content']}>
                <input
                  type="password"
                  placeholder="Password"
                  value={this.state.password}
                  onChange={this.onChangePassword.bind(this)}
                  ref={(input) => this.passwordInput = input}
                  disabled={this.props.inputDisabled}
                />
                <div className={css['form-subtitle']}>
                  <a href="#" onClick={this.onClickForgotPassword.bind(this)}>
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>
            <div className={css['form-footer']}>
              <span className={css['modal-form-error']}>
                {this.state.errorMessage}
              </span>
              <span className={css['form-submit']}>
                <input
                  type="submit"
                  value="Log in"
                  onClick={this.onSubmit.bind(this)}
                  disabled={this.props.inputDisabled}
                />
              </span>
            </div>
          </form>
        </div>
      </Modal>
    );
  }

  onChangeUsernameOrEmail(event: SyntheticEvent) {
    const target = event.target;
    invariant(target instanceof HTMLInputElement, "target not input");
    this.setState({ usernameOrEmail: target.value });
  }

  onChangePassword(event: SyntheticEvent) {
    const target = event.target;
    invariant(target instanceof HTMLInputElement, "target not input");
    this.setState({ password: target.value });
  }

  onClickForgotPassword(event: SyntheticEvent) {
    event.preventDefault();
    this.props.setModal(
      <ForgotPasswordModal
        onClose={this.props.onClose}
        setModal={this.props.setModal}
      />
    );
  }

  onSubmit(event: SyntheticEvent) {
    event.preventDefault();

    if (
      this.state.usernameOrEmail.search(validUsernameRegex) === -1 &&
      this.state.usernameOrEmail.search(validEmailRegex) === -1
    ) {
      this.setState(
        {
          usernameOrEmail: "",
          errorMessage: "alphanumeric usernames or emails only",
        },
        () => {
          invariant(
            this.usernameOrEmailInput,
            "usernameOrEmailInput ref unset",
          );
          this.usernameOrEmailInput.focus();
        },
      );
      return;
    }

    this.props.dispatchActionPromise(logInActionType, this.submit());
  }

  async submit() {
    try {
      const response = await logIn(
        this.state.usernameOrEmail,
        this.state.password,
      );
      this.props.onClose();
      return {
        calendarInfos: response.calendar_infos,
        userInfo: {
          email: response.email,
          username: response.username,
          emailVerified: response.email_verified,
        },
      };
    } catch (e) {
      if (e.message === 'invalid_parameters') {
        this.setState(
          {
            usernameOrEmail: "",
            errorMessage: "user doesn't exist",
          },
          () => {
            invariant(
              this.usernameOrEmailInput,
              "usernameOrEmailInput ref unset",
            );
            this.usernameOrEmailInput.focus();
          },
        );
      } else if (e.message === 'invalid_credentials') {
        this.setState(
          {
            password: "",
            errorMessage: "wrong password",
          },
          () => {
            invariant(this.passwordInput, "passwordInput ref unset");
            this.passwordInput.focus();
          },
        );
      } else {
        this.setState(
          {
            usernameOrEmail: "",
            password: "",
            errorMessage: "unknown error",
          },
          () => {
            invariant(
              this.usernameOrEmailInput,
              "usernameOrEmailInput ref unset",
            );
            this.usernameOrEmailInput.focus();
          },
        );
      }
      throw e;
    }
  }

}

LogInModal.propTypes = {
  dispatchActionPromise: React.PropTypes.func.isRequired,
  inputDisabled: React.PropTypes.bool.isRequired,
  onClose: React.PropTypes.func.isRequired,
  setModal: React.PropTypes.func.isRequired,
};

const loadingStatusSelector = createLoadingStatusSelector(logInActionType);

export default connect(
  (state: AppState) => ({
    inputDisabled: loadingStatusSelector(state) === "loading",
  }),
  includeDispatchActionProps({ dispatchActionPromise: true }),
)(LogInModal);
