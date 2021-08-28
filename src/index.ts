import { createComponent, createElement } from "./virtual-dom/VDOM";
import { renderDOM } from "./virtual-dom/render";
import { Component } from "./virtual-dom/Component";

const div = createElement("div");
const span = createElement("span");
const button = createElement("button");

interface SomeComponentState {
  name: string;
}

interface SomeComponentProps {
  hey: string;
}

class SomeComponent extends Component<SomeComponentProps, SomeComponentState> {
  state = { name: "123" };

  render() {
    return div(
      {
        onClick: (e: Event) => {
          console.log(e);
          this.setState((prevState) => ({
            ...prevState,
            name: prevState.name + "1",
          }));
          console.log("hi");
        },
      },
      [
        createComponent(SubComponent, {
          onClick: (event: Event) => {
            console.log("123");
          },
          text: "!231241",
        }),
        span({}, [this.state.name]),
      ]
    );
  }
}

interface SubComponentProps {
  onClick: (event: Event) => void;
  text: string;
}

interface SubComponentState {
  just: string;
}

class SubComponent extends Component<SubComponentProps, SubComponentState> {
  state = { just: "!" };

  render() {
    return button(
      {
        onClick: this.props.onClick,
      },
      [this.props.text]
    );
  }
}

renderDOM("root", createComponent(SomeComponent, { hey: "hey" }));
