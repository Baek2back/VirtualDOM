import { createDiff, Operation, OperationType } from "./operation";
import { applyOperation } from "./render";
import { VDOMNode } from "./VDOM";

export abstract class Component<P, S> {
  protected props: P;
  protected state: S;

  private scheduled: number | null = null;

  private currentRootNode: VDOMNode;
  private mountedElement: Node | null;

  protected setState(updater: (prevState: S) => S): void {
    if (!this.mountedElement) {
      throw new Error("you are trying an unmounted component");
    }
    const newState = updater(this.state);
    if (this.state === newState) return;
    this.state = newState;
    this.schedule();
  }

  private schedule() {
    if (this.scheduled !== null) {
      cancelAnimationFrame(this.scheduled);
      this.scheduled = null;
    }
    this.scheduled = requestAnimationFrame(() => {
      applyOperation(this.getUpdateOperation());
    });
  }

  public setProps(props: P): Operation {
    // TODO: isNil
    if (this.mountedElement == null) {
      throw new Error("Your are setting the props of an inmounted component");
    }
    this.state = this.componentWillReceiveProps(props, this.state);
    this.props = props;
    return this.getUpdateOperation();
  }

  private getUpdateOperation(): Operation {
    const newRootNode = this.render();
    const operation = createDiff(this.currentRootNode, newRootNode);
    if (operation.type === OperationType.REPLACE) {
      operation.callback = (element: Node) => (this.mountedElement = element);
    }
    this.currentRootNode = newRootNode;
    requestAnimationFrame(this.componentDidUpdate.bind(this));
    return operation;
  }

  public notifyMounted(element: Node) {
    this.mountedElement = element;
    // or setTimeout
    requestAnimationFrame(this.componentDidMount.bind(this));
  }

  public initProps(props: P): VDOMNode {
    this.props = props;
    this.currentRootNode = this.render();
    return this.currentRootNode;
  }

  public unmount(): void {
    this.componentWillUnmount();
    this.mountedElement = null;
  }

  public componentDidMount() {}
  public componentWillReceiveProps(props: P, state: S): S {
    return state;
  }
  public componentDidUpdate() {}
  public componentWillUnmount() {}

  public abstract render(): VDOMNode;
}
