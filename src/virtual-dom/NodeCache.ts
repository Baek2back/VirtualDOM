import { VDOMNode } from "./VDOM";

export class NodeCache extends WeakMap<VDOMNode, Node> {
  replace(oldNode: VDOMNode, newNode: VDOMNode): Node {
    const value: Node = this.get(oldNode)!;
    this.delete(oldNode);
    this.set(newNode, value);
    return value;
  }
}

const nodeCacheInstance = new NodeCache();

export default nodeCacheInstance;
