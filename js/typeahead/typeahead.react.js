// @flow

import type { CalendarInfo } from '../calendar-info';
import { calendarInfoPropType } from '../calendar-info';
import type { NavID } from './typeahead-action-option.react';
import type { AppState, UpdateStore } from '../redux-reducer';

import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import invariant from 'invariant';
import update from 'immutability-helper';
import _ from 'lodash';
import { connect } from 'react-redux';

import TypeaheadActionOption from './typeahead-action-option.react';
import TypeaheadCalendarOption from './typeahead-calendar-option.react';
import TypeaheadOptionButtons from './typeahead-option-buttons.react';
import TypeaheadPane from './typeahead-pane.react';
import { SearchIndex, searchIndex } from './search-index';
import { currentNavID } from '../nav-utils';
import {
  typeaheadSortedCalendarInfos,
  subscriptionExists,
} from '../calendar-utils';
import { htmlTargetFromEvent } from '../vector-utils';
import { UpCaret, DownCaret } from '../vectors.react';

type Props = {
  currentNavID: ?string,
  calendarInfos: {[id: string]: CalendarInfo},
  currentlyHome: bool,
  currentCalendarID: ?string,
  subscriptionExists: bool,
  searchIndex: SearchIndex,
  sortedCalendarInfos: {[id: string]: CalendarInfo[]},
  setModal: (modal: React.Element<any>) => void,
  clearModal: () => void,
};
type State = {
  active: bool,
  searchActive: bool,
  frozenNavIDs: {[id: string]: bool},
  typeaheadValue: string,
  searchResults: string[],
  recommendedCalendars: CalendarInfo[],
};
type TypeaheadCalendarOptionConnect = {
  getWrappedInstance: () => TypeaheadCalendarOption,
};

class Typeahead extends React.Component {

  static recommendationSize;

  props: Props;
  state: State;

  input: ?HTMLInputElement;
  dropdown: ?HTMLElement;
  current: ?HTMLElement;
  magnifyingGlass: ?HTMLElement;
  promptedCalendarOption: ?TypeaheadCalendarOptionConnect;

  constructor(props: Props) {
    super(props);
    let active = false;
    const frozenNavIDs = {};
    if (!props.currentNavID) {
      frozenNavIDs["unauthorized"] = true;
      invariant(
        props.currentCalendarID,
        "no currentNavID only if unauthorized currentCalendarID",
      );
      frozenNavIDs[props.currentCalendarID] = true;
      active = true;
    }
    const recommendedCalendars = this.sampleRecommendations(props);
    this.state = {
      active,
      searchActive: false,
      frozenNavIDs,
      typeaheadValue: Typeahead.getCurrentNavName(props),
      searchResults: [],
      recommendedCalendars,
    };
  }

  static getCurrentNavName(props: Props) {
    if (props.currentNavID === "home") {
      return TypeaheadActionOption.homeText;
    } else if (props.currentNavID) {
      return props.calendarInfos[props.currentNavID].name;
    } else {
      return "";
    }
  }

  componentDidMount() {
    if (!this.props.currentNavID) {
      invariant(
        this.promptedCalendarOption,
        "no currentNavID only if unauthorized currentCalendarID",
      );
      this.promptedCalendarOption
        .getWrappedInstance()
        .openAndFocusPasswordEntry();
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    // Navigational event occurred?
    const updateObj = {};
    let navigateToUnauthorized = false;
    if (nextProps.currentNavID !== this.props.currentNavID) {
      updateObj.typeaheadValue = Typeahead.getCurrentNavName(nextProps);
      if (!this.props.currentNavID) {
        this.unfreezeAll();
      } else if (!nextProps.currentNavID) {
        updateObj.active = true;
        navigateToUnauthorized = true;
        this.freeze("unauthorized");
        invariant(
          nextProps.currentCalendarID,
          "no currentNavID only if unauthorized currentCalendarID",
        );
        this.freeze(nextProps.currentCalendarID);
      }
    }

    if (
      nextProps.sortedCalendarInfos.recommended !==
        this.props.sortedCalendarInfos.recommended
    ) {
      const stillValidRecommendations = _.filter(
        this.state.recommendedCalendars,
        (calendarInfo: CalendarInfo) => _.some(
          nextProps.sortedCalendarInfos.recommended,
          { id: calendarInfo.id },
        ),
      );
      let newRecommendationsNeeded =
        Typeahead.recommendationSize - stillValidRecommendations.length;
      if (newRecommendationsNeeded > 0) {
        const randomCalendarInfos =
          _.chain(nextProps.sortedCalendarInfos.recommended)
            .filter((calendarInfo: CalendarInfo) => !_.some(
              stillValidRecommendations,
              { id: calendarInfo.id },
            )).sampleSize(newRecommendationsNeeded)
            .value();
        updateObj.recommendedCalendars = update(
          stillValidRecommendations,
          { $push: randomCalendarInfos },
        );
      }
    }

    if (updateObj) {
      this.setState(
        updateObj,
        () => {
          if (navigateToUnauthorized) {
            invariant(
              this.promptedCalendarOption,
              "no currentNavID only if unauthorized currentCalendarID",
            );
            this.promptedCalendarOption
              .getWrappedInstance()
              .openAndFocusPasswordEntry();
          } else if (updateObj.typeaheadValue && this.state.active) {
            // If the typeahead is active, we should reselect
            const input = this.input;
            invariant(input, "ref should be set");
            input.focus();
            input.select();
          }
        },
      );
    }
  }

  render() {
    let dropdown = null;
    if (this.state.searchActive) {
      let resultsPane;
      if (this.state.searchResults.length !== 0) {
        resultsPane = (
          <TypeaheadPane
            paneTitle="Results"
            pageSize={10}
            totalResults={this.state.searchResults.length}
            resultsBetween={this.searchResultOptionsForPage.bind(this)}
            key="results"
          />
        );
      } else {
        const noResults = (
          <div className="calendar-nav-no-results" key="none">
            No results
          </div>
        );
        resultsPane = (
          <TypeaheadPane
            paneTitle="Results"
            pageSize={1}
            totalResults={1}
            resultsBetween={() => [ noResults ]}
            key="results"
          />
        );
      }
      dropdown = (
        <div
          className="calendar-nav-dropdown"
          ref={(dropdown) => this.dropdown = dropdown}
        >{resultsPane}</div>
      );
    } else if (this.state.active) {
      const panes = [];
      const currentOptions = this.props.sortedCalendarInfos.current.map(
        (calendarInfo) => this.buildCalendarOption(calendarInfo),
      );
      panes.push(
        <TypeaheadPane
          paneTitle="Current"
          pageSize={1}
          totalResults={currentOptions.length}
          resultsBetween={() => currentOptions}
          key="current"
        />
      );
      if (this.props.currentNavID !== "home" && this.props.subscriptionExists) {
        const homeOption =
          this.buildActionOption("home", TypeaheadActionOption.homeText);
        panes.push(
          <TypeaheadPane
            paneTitle="Home"
            pageSize={1}
            totalResults={1}
            resultsBetween={() => [ homeOption ]}
            key="home"
          />
        );
      }
      panes.push(
        <TypeaheadPane
          paneTitle="Subscribed"
          pageSize={5}
          totalResults={this.props.sortedCalendarInfos.subscribed.length}
          resultsBetween={this.subscribedCalendarOptionsForPage.bind(this)}
          key="subscribed"
        />
      );
      const recommendedOptions = this.state.recommendedCalendars
        .map((calendarInfo) => this.buildCalendarOption(calendarInfo));
      panes.push(
        <TypeaheadPane
          paneTitle="Recommended"
          pageSize={Typeahead.recommendationSize}
          totalResults={recommendedOptions.length}
          resultsBetween={() => recommendedOptions}
          key="recommended"
        />
      );
      if (this.props.currentNavID) {
        const newOption =
          this.buildActionOption("new", TypeaheadActionOption.newText);
        panes.push(
          <TypeaheadPane
            paneTitle="Actions"
            pageSize={1}
            totalResults={1}
            resultsBetween={() => [ newOption ]}
            key="actions"
          />
        );
      }
      dropdown = (
        <div
          className="calendar-nav-dropdown"
          ref={(dropdown) => this.dropdown = dropdown}
        >
          {panes}
        </div>
      );
    }

    let rightAligned = null;
    if (this.state.active) {
      const currentCalendarInfo = this.props.currentNavID &&
        this.props.calendarInfos[this.props.currentNavID];
      if (currentCalendarInfo) {
        rightAligned = (
          <TypeaheadOptionButtons
            calendarInfo={currentCalendarInfo}
            setModal={this.props.setModal}
            clearModal={this.props.clearModal}
            freezeTypeahead={this.freeze.bind(this)}
            unfreezeTypeahead={this.unfreeze.bind(this)}
          />
        );
      }
    } else {
      rightAligned = (  
        <span className="calendar-nav-symbols">
          <UpCaret
            className="calendar-nav-first-symbol"
            height="12px"
            width="7px"
          />
          <DownCaret
            className="calendar-nav-second-symbol"
            height="12px"
            width="7px"
          />
        </span>
      );
    }

    return (
      <div
        onMouseDown={this.onMouseDown.bind(this)}
        className={classNames({
          'calendar-nav': true,
          'calendar-nav-active': this.state.active,
          'calendar-nav-null-state': !this.props.currentNavID,
        })}
      >
        <div
          className="calendar-nav-current"
          ref={(current) => this.current = current}
        >
          <img
            src="images/search.svg"
            alt="search"
            ref={(magnifyingGlass) => this.magnifyingGlass = magnifyingGlass}
          />
          {rightAligned}
          <div className="typeahead-container">
            <input
              type="text"
              className="typeahead"
              ref={(input) => this.input = input}
              onBlur={() => this.setActive(false)}
              onKeyDown={this.onKeyDown.bind(this)}
              value={this.state.typeaheadValue}
              onChange={this.onChange.bind(this)}
            />
          </div>
        </div>
        {dropdown}
      </div>
    );
  }

  buildOption(navID: string) {
    const calendarInfo = this.props.calendarInfos[navID];
    if (calendarInfo !== undefined) {
      return this.buildCalendarOption(calendarInfo);
    } else if (navID === "home") {
      return this.buildActionOption("home", TypeaheadActionOption.homeText);
    } else if (navID === "new") {
      return this.buildActionOption("new", TypeaheadActionOption.newText);
    } else {
      invariant(false, "invalid navID passed to buildOption");
    }
  }

  buildActionOption(navID: NavID, name: string) {
    const onTransition = () => {
      this.unfreezeAll();
      this.setActive(false);
    };
    return (
      <TypeaheadActionOption
        navID={navID}
        name={name}
        freezeTypeahead={this.freeze.bind(this)}
        onTransition={onTransition}
        setModal={this.props.setModal}
        clearModal={this.props.clearModal}
        frozen={!!this.state.frozenNavIDs[navID]}
        key={navID}
      />
    );
  }

  buildCalendarOption(calendarInfo: CalendarInfo) {
    const onTransition = () => {
      this.unfreezeAll();
      this.setActive(false);
    };
    const possiblySetPromptedRef = (option) => {
      if (
        !this.props.currentNavID &&
        calendarInfo.id === this.props.currentCalendarID
      ) {
        this.promptedCalendarOption = option;
      }
    };
    return (
      <TypeaheadCalendarOption
        calendarInfo={calendarInfo}
        freezeTypeahead={this.freeze.bind(this)}
        unfreezeTypeahead={this.unfreeze.bind(this)}
        onTransition={onTransition}
        frozen={!!this.state.frozenNavIDs[calendarInfo.id]}
        setModal={this.props.setModal}
        clearModal={this.props.clearModal}
        ref={possiblySetPromptedRef}
        key={calendarInfo.id}
      />
    );
  }

  setActive(active: bool) {
    let setFocus = null;
    this.setState(
      (prevState, props) => {
        const frozen = !_.isEmpty(prevState.frozenNavIDs);
        if (frozen || active === prevState.active) {
          return {};
        }
        let typeaheadValue = prevState.typeaheadValue;
        let recommendedCalendars = prevState.recommendedCalendars;
        setFocus = active;
        if (!active) {
          typeaheadValue = Typeahead.getCurrentNavName(props);
          recommendedCalendars = this.sampleRecommendations(props);
        }
        return {
          active,
          searchActive: prevState.searchActive && active,
          typeaheadValue,
          recommendedCalendars,
        };
      },
      () => {
        const input = this.input;
        invariant(input, "ref should be set");
        if (setFocus === true) {
          input.select();
          input.focus();
        } else if (setFocus === false) {
          input.blur();
        }
      },
    );
  }

  onMouseDown(event: SyntheticEvent) {
    if (!this.state.active) {
      this.setActive(true);
      // This prevents a possible focus event on input.typeahead from overriding
      // the select() that gets called in setActive
      event.preventDefault();
      return;
    }
    const target = htmlTargetFromEvent(event);
    const dropdown = this.dropdown;
    const current = this.current;
    const magnifyingGlass = this.magnifyingGlass;
    invariant(dropdown, "ref should be set");
    invariant(current, "ref should be set");
    invariant(magnifyingGlass, "ref should be set");
    if (target === this.input) {
      target.focus();
      invariant(this.input, "ref should be set");
      // In some browsers, HTML elements keep state about what was selected when
      // they lost focus. If previously something was selected and we focus on
      // it, that is selected again (until an onMouseUp event clears it). This
      // is a bit confusing in my opinion, so we clear any selection here so
      // that the focus behaves consistently.
      this.input.selectionStart = this.input.selectionEnd;
      return;
    }
    if (
      dropdown.contains(target) ||
      (current.contains(target) && !magnifyingGlass.contains(target))
    ) {
      // This prevents onBlur from firing on input#typeahead
      event.preventDefault(); 
    } else if (this.state.active) {
      this.setActive(false);
    }
  }

  freeze(navID: string) {
    this.setState((prevState, props) => {
      const updateObj = {};
      updateObj[navID] = { $set: true };
      return update(prevState, { frozenNavIDs: updateObj });
    });
  }

  unfreeze(navID: string) {
    this.setState(
      (prevState, props) => {
        const newFrozenNavIDs = _.omit(prevState.frozenNavIDs, [ navID ]);
        return update(prevState, { frozenNavIDs: { $set: newFrozenNavIDs } });
      },
      () => {
        invariant(this.input, "ref should be set");
        if (this.input !== document.activeElement) {
          this.setActive(false);
        }
      },
    );
  }

  unfreezeAll() {
    this.setState(
      (prevState, props) => {
        return update(prevState, { frozenNavIDs: { $set: {} } });
      },
      () => {
        invariant(this.input, "ref should be set");
        if (this.input !== document.activeElement) {
          this.setActive(false);
        }
      },
    );
  }

  isActive() {
    return this.state.active;
  }

  onKeyDown(event: SyntheticEvent) {
    if (event.keyCode == 27) { // esc key
      this.setActive(false);
      invariant(this.input, "ref should be set");
      this.input.blur();
    }
  }

  onChange(event: SyntheticEvent) {
    const target = event.target;
    invariant(target instanceof HTMLInputElement, "target not input");
    this.setState({
      typeaheadValue: target.value,
      searchResults: this.props.searchIndex.getSearchResults(target.value),
      searchActive: target.value.trim() !== "",
    });
  }

  searchResultOptionsForPage(start: number, end: number) {
    return this.state.searchResults.slice(start, end)
      .map((navID) => this.buildOption(navID));
  }

  subscribedCalendarOptionsForPage(start: number, end: number) {
    return this.props.sortedCalendarInfos.subscribed.slice(start, end)
      .map((calendarInfo) => this.buildCalendarOption(calendarInfo));
  }

  sampleRecommendations(props: Props) {
    return _.sampleSize(
      props.sortedCalendarInfos.recommended,
      Typeahead.recommendationSize,
    );
  }

}

Typeahead.recommendationSize = 3;

Typeahead.propTypes = {
  currentNavID: React.PropTypes.string,
  calendarInfos: React.PropTypes.objectOf(calendarInfoPropType).isRequired,
  currentlyHome: React.PropTypes.bool.isRequired,
  currentCalendarID: React.PropTypes.string,
  subscriptionExists: React.PropTypes.bool.isRequired,
  searchIndex: React.PropTypes.instanceOf(SearchIndex),
  sortedCalendarInfos: React.PropTypes.objectOf(
    React.PropTypes.arrayOf(calendarInfoPropType),
  ).isRequired,
  setModal: React.PropTypes.func.isRequired,
  clearModal: React.PropTypes.func.isRequired,
};

export default connect((state: AppState) => ({
  currentNavID: currentNavID(state),
  calendarInfos: state.calendarInfos,
  currentlyHome: state.navInfo.home,
  currentCalendarID: state.navInfo.calendarID,
  subscriptionExists: subscriptionExists(state),
  searchIndex: searchIndex(state),
  sortedCalendarInfos: typeaheadSortedCalendarInfos(state),
}))(Typeahead);
