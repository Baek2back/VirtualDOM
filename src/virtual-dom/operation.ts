import { VDOMAttributes, VDOMNode, VDOMType } from "./VDOM";
import nodeCacheInstance, { NodeCache } from "./NodeCache";

export const enum OperationType {
  APPEND,
  REPLACE,
  REMOVE,
  UPDATE,
  TEXT,
  SKIP,
}

interface AppendOperation {
  type: OperationType.APPEND;
  node: VDOMNode;
  domNode: Node;
}

interface ReplaceOperation {
  type: OperationType.REPLACE;
  node: VDOMNode;
  domNode: Node;
  callback?: (domNode: Node) => void;
}

interface RemoveOperation {
  type: OperationType.REMOVE;
  domNode: Node;
}

interface UpdateOperation {
  type: OperationType.UPDATE;
  props: VDOMAttributes;
  children: Operation[];
  domNode: Node;
}

interface TextOperation {
  type: OperationType.TEXT;
  value: string;
  domNode: Node;
}

interface SkipOperation {
  type: OperationType.SKIP;
}

export type Operation =
  | AppendOperation
  | ReplaceOperation
  | RemoveOperation
  | UpdateOperation
  | TextOperation
  | SkipOperation;

export const createDiff = (
  (nodeCache: NodeCache) =>
  (oldNode: VDOMNode, newNode: VDOMNode): Operation => {
    if (oldNode === newNode) {
      return {
        type: OperationType.SKIP,
      };
    }

    if (
      oldNode.type === VDOMType.TEXT &&
      newNode.type === VDOMType.TEXT &&
      oldNode.value === newNode.value
    ) {
      return {
        type: OperationType.SKIP,
      };
    }

    const domNode: Node = nodeCache.replace(oldNode, newNode);

    if (
      oldNode.type === VDOMType.COMPONENT &&
      newNode.type === VDOMType.COMPONENT &&
      oldNode.component === newNode.component &&
      oldNode.instance
    ) {
      newNode.instance = oldNode.instance;
      // TODO: props 비교 검증 로직 추가
      if (oldNode.props === newNode.props) {
        return { type: OperationType.SKIP };
      }
      return newNode.instance.setProps(newNode.props);
    }

    if (oldNode.type === VDOMType.COMPONENT) {
      oldNode.instance?.unmount();
      oldNode.instance = undefined;
      return {
        type: OperationType.REPLACE,
        node: newNode,
        domNode,
      };
    }

    if (newNode.type === VDOMType.COMPONENT) {
      const { component: Component } = newNode;
      newNode.instance = new Component();
      return {
        type: OperationType.REPLACE,
        node: newNode.instance.initProps(newNode.props),
        domNode,
        callback: (element: Node) => newNode.instance?.notifyMounted(element),
      };
    }

    if (oldNode.type === VDOMType.TEXT || newNode.type === VDOMType.TEXT) {
      return {
        type: OperationType.REPLACE,
        node: newNode,
        domNode,
      };
    }

    if (oldNode.tagName !== newNode.tagName) {
      return {
        type: OperationType.REPLACE,
        node: newNode,
        domNode,
      };
    }

    const attrDiff = diffAttrs(oldNode.props, newNode.props);
    const childrenDiff = diffChildren(
      oldNode.children,
      newNode.children,
      domNode
    );

    return {
      type: OperationType.UPDATE,
      props: attrDiff,
      children: childrenDiff,
      domNode,
    };
  }
)(nodeCacheInstance);

const diffAttrs = (
  oldAttrs: VDOMAttributes,
  newAttrs: VDOMAttributes
): VDOMAttributes => {
  const diff: VDOMAttributes = {};

  for (const key in oldAttrs) {
    if (oldAttrs[key] !== newAttrs[key]) {
      diff[key] = newAttrs[key];
    }
  }

  for (const key in newAttrs) {
    if (oldAttrs[key] === undefined) {
      diff[key] = newAttrs[key];
    }
  }

  return diff;
};

const diffChildren = (
  (nodeCache: NodeCache) =>
  (
    oldChildren: VDOMNode[],
    newChildren: VDOMNode[],
    parentNode: Node
  ): Operation[] => {
    const operations: Operation[] = [];

    for (let i = 0; i < Math.max(oldChildren.length, newChildren.length); i++) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      if (oldChild === undefined) {
        operations.push({
          type: OperationType.APPEND,
          node: newChild,
          domNode: parentNode,
        });
      } else if (newChild === undefined) {
        operations.push({
          type: OperationType.REMOVE,
          domNode: nodeCache.get(oldChild)!,
        });
      } else {
        operations.push(createDiff(oldChild, newChild));
      }
    }

    return operations;
  }
)(nodeCacheInstance);
