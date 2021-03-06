import { VDOMAttributes, VDOMNode, VDOMType } from "./VDOM";
import nodeCacheInstance, { NodeCache } from "./NodeCache";
import { Operation, OperationType } from "./operation";

const isListener = (name: string) => name.startsWith("on");

export const render = ((nodeCache: NodeCache) => {
  return (node: VDOMNode): Node => {
    switch (node.type) {
      case VDOMType.ELEMENT: {
        const element: HTMLElement = document.createElement(node.tagName);
        const { props, children } = node;

        Object.entries(props).forEach(([key, value]) => {
          if (isListener(key)) {
            const eventType = key.toLowerCase().substring(2);
            element.addEventListener(eventType, value as EventListener);
          } else {
            (element as Record<string, any>)[key] = value;
          }
        });

        children.forEach((child) => {
          element.appendChild(render(child));
        });

        nodeCache.set(node, element);
        return element;
      }
      case VDOMType.TEXT: {
        const element: Text = document.createTextNode(node.value);

        nodeCache.set(node, element);
        return element;
      }
      case VDOMType.COMPONENT: {
        if (node.instance) {
          const element = render(node.instance.render());
          node.instance.notifyMounted();
          nodeCache.set(node, element);
          return element;
        }

        const { component: Component } = node;
        node.instance = new Component();

        const element = render(node.instance.initProps(node.props));
        node.instance.notifyMounted();

        nodeCache.set(node, element);
        return element;
      }
    }
  };
})(nodeCacheInstance);

export function renderDOM(id: string, rootNode: VDOMNode): void {
  const root = document.getElementById(id);
  if (root === null) {
    throw new Error("rootNode not found");
  }
  root.appendChild(render(rootNode));
}

export const applyOperation = (operation: Operation): void => {
  switch (operation.type) {
    case OperationType.SKIP: {
      break;
    }
    case OperationType.TEXT: {
      operation.domNode.textContent = operation.value;
      break;
    }
    case OperationType.REPLACE: {
      const toReplace: Node = operation.domNode;
      const replacement: Node = render(operation.node);
      replaceElement(toReplace, replacement);
      break;
    }
    case OperationType.REMOVE: {
      removeElement(operation.domNode);
      break;
    }
    case OperationType.APPEND: {
      const parentNode = operation.domNode;
      const toAppend = render(operation.node);
      parentNode.appendChild(toAppend);
      break;
    }
    case OperationType.UPDATE: {
      applyAttrs(operation.domNode as HTMLElement, operation.props);
      for (const child of operation.children) {
        applyOperation(child);
      }
      break;
    }
  }
};

function replaceElement(toReplace: Node, replacement: Node): void {
  const parentNode: Node | null = toReplace.parentNode;
  if (parentNode === null) return;
  parentNode.replaceChild(replacement, toReplace);
}

function removeElement(node: Node): void {
  const parentNode: Node | null = node.parentNode;
  if (parentNode === null) return;
  parentNode.removeChild(node);
}

function applyAttrs(element: HTMLElement, attrs: VDOMAttributes): void {
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined) {
      element.removeAttribute(key);
      (element as Record<string, any>)[key] = undefined;
    } else {
      if (isListener(key)) return;
      if (typeof value === "string" || typeof value === "boolean") {
        element.setAttribute(key, value + "");
      }
      (element as Record<string, any>)[key] = value;
    }
  });
}
