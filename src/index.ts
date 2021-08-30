import { createComponent, createElement } from "./virtual-dom/VDOM";
import { renderDOM } from "./virtual-dom/render";
import { Component } from "./virtual-dom/Component";

const div = createElement("div");
const span = createElement("span");
const button = createElement("button");
const input = createElement("input");
const form = createElement("form");

interface SomeComponentState {
  name: string;
  toggle: boolean;
}

interface SomeComponentProps {
  hey: string;
}

class SomeComponent extends Component<SomeComponentProps, SomeComponentState> {
  state = { name: "123", toggle: true };

  render() {
    return div({}, [
      createComponent(SubComponent, {
        onClick: (event: Event) => {
          console.log("123");
        },
        text: "!231241",
      }),
      span({}, [this.state.name]),
    ]);
  }
}

interface SubComponentProps {
  onClick: (event: Event) => void;
  text: string;
}

interface SubComponentState {
  toggle: boolean;
  multipleText: string;
}

class SubComponent extends Component<SubComponentProps, SubComponentState> {
  state = { toggle: true, multipleText: "a" };
  componentWillUnmount() {
    console.log("unmount");
  }
  render() {
    return form(
      {
        onSubmit: (event: Event) => {
          console.log("hi");
          event.preventDefault();
          this.setState((prevState) => {
            return {
              ...prevState,
              toggle: !prevState.toggle,
              multipleText: prevState.multipleText + "z",
            };
          });
          console.log("state", this.state);
        },
      },
      [
        input({}, []),
        button(
          {
            onClick: (event: Event) => {
              console.log("onCLick");
              this.setState((prevState) => {
                console.log("prevState", prevState);
                return {
                  ...prevState,
                  multipleText: prevState.multipleText + "g",
                };
              });
            },
          },
          ["click"]
        ),
        this.state.toggle + "",
        this.state.multipleText,
      ]
    );
  }
}

renderDOM("root", createComponent(SomeComponent, { hey: "hey" }));
