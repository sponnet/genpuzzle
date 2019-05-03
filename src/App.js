import React from "react";
import "bulma/css/bulma.css";
import Jigsaw1 from "./components/Jigsaw1";

function App() {
  return (
    <div className="App">
      <section className="hero is-fullheight is-default is-bold">
        <div className="hero-body">
          <div className="container has-text-centered">
            <Jigsaw1 />
          </div>
        </div>

        <div className="hero-foot">
          <div className="container">
            <div className="tabs is-centered">
              <ul>
                <li>
                  <a className="" href="https://github.com/sponnet/genpuzzle">
                    github
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
