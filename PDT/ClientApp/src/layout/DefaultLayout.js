import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

// routes config
import routes from '../_routes';

class DefaultLayout extends Component {

  render() {

    return (
      <div className="app">
        <div className="app-body">
          <main className="main">
              <Switch>
                {routes.map((route, idx) => {
                    return route.component ? (<Route key={idx} path={route.path} exact={route.exact} name={route.name} render={props => (
                        <route.component {...props} />
                      )} />)
                      : (null);
                  },
                )}
                <Redirect from="/" to="/404" />
              </Switch>
          </main>
        </div>
      </div>
    );
  }
}

export default DefaultLayout;
