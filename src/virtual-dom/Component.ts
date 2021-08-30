import { createDiff, Operation } from "./operation";
import { applyOperation } from "./render";
import { VDOMNode } from "./VDOM";

export abstract class Component<P, S> {
  protected props: P;
  protected state: S;

  private scheduled: number | null = null;

  private currentRootNode: VDOMNode;

  protected setState(updater: (prevState: S) => S): void {
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
    this.state = this.componentWillReceiveProps(props, this.state);
    this.props = props;
    return this.getUpdateOperation();
  }

  private getUpdateOperation(): Operation {
    const newRootNode = this.render();
    const operation = createDiff(this.currentRootNode, newRootNode);

    this.currentRootNode = newRootNode;
    requestAnimationFrame(this.componentDidUpdate.bind(this));
    return operation;
  }

  public notifyMounted(): void {
    requestAnimationFrame(this.componentDidMount.bind(this));
  }

  public initProps(props: P): VDOMNode {
    this.props = props;
    this.currentRootNode = this.render();
    return this.currentRootNode;
  }

  public unmount(): void {
    this.componentWillUnmount();
  }

  public componentWillReceiveProps(props: P, state: S): S {
    return state;
  }
  public componentDidMount() {}
  public componentDidUpdate() {}
  public componentWillUnmount() {}

  public abstract render(): VDOMNode;
}
