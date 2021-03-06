import React from 'react';
import ReactTestUtils from 'react/lib/ReactTestUtils';
import Relay from 'react-relay';
import { Route } from 'react-router';
import createMemoryHistory from 'react-router/lib/createMemoryHistory';
import RelayLocalSchema from 'relay-local-schema';

import { RelayRouter } from '../src';

import schema from './fixtures/schema';

describe('<RelayRouter>', () => {
  beforeEach(() => {
    Relay.injectNetworkLayer(
      new RelayLocalSchema.NetworkLayer({ schema })
    );
  });

  describe('kitchen sink', () => {
    class Widget extends React.Component {
      render() {
        const { widget, first, second } = this.props;

        return (
          <div className={widget.name}>
            {first}
            {second}
          </div>
        );
      }
    }

    const WidgetContainer = Relay.createContainer(Widget, {
      fragments: {
        widget: () => Relay.QL`
          fragment on Widget {
            name,
          }
        `,
      },
    });

    const routes = (
      <Route
        path="/"
        component={WidgetContainer}
        queries={{
          widget: () => Relay.QL`query { widget }`,
        }}
      >
        <Route
          path=":pathName"
          components={{ first: WidgetContainer, second: WidgetContainer }}
          queries={{
            first: { widget: () => Relay.QL`query { widgetByArg(name: $pathName) }` },
            second: { widget: () => Relay.QL`query { widgetByArg(name: $queryName) }` },
          }}
          queryParams={['queryName']}
        />
      </Route>
    );

    let instance;

    beforeEach(done => {
      class Component extends React.Component {
        onReadyStateChange(readyState) {
          if (!readyState.done) {
            return;
          }

          done();
        }

        render() {
          return (
            <RelayRouter
              history={createMemoryHistory('/bar?queryName=baz')}
              routes={routes}
              onReadyStateChange={this.onReadyStateChange}
            />
          );
        }
      }

      instance = ReactTestUtils.renderIntoDocument(<Component />);
    });

    it('should support basic use', () => {
      ReactTestUtils.findRenderedDOMComponentWithClass(instance, 'foo');
    });

    it('should support path params', () => {
      ReactTestUtils.findRenderedDOMComponentWithClass(instance, 'bar');
    });

    it('should support query params', () => {
      ReactTestUtils.findRenderedDOMComponentWithClass(instance, 'baz');
    });
  });
});
