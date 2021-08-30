import { Component } from "./Component";

export const enum VDOMType {
  TEXT,
  ELEMENT,
  COMPONENT,
}

export type VDOMAttributes = Record<string, unknown>;

export interface VDOMElement {
  type: VDOMType.ELEMENT;
  tagName: string;
  children: VDOMNode[];
  props: VDOMAttributes;
}

export interface VDOMText {
  type: VDOMType.TEXT;
  value: string;
}

export interface VDOMComponent {
  type: VDOMType.COMPONENT;
  instance?: Component<unknown, unknown>;
  props: VDOMAttributes;
  component: Class<Component<unknown, unknown>>;
}

export type VDOMNode = VDOMText | VDOMElement | VDOMComponent;

export const text = (value: string): VDOMText =>
  Object.assign(Object.create(null), {
    type: VDOMType.TEXT,
    value,
  });

export function createElement(tagName: string) {
  return (
    props: VDOMAttributes,
    children: (VDOMNode | string)[]
  ): VDOMElement => {
    return Object.assign(Object.create(null), {
      type: VDOMType.ELEMENT,
      tagName,
      props,
      children: children.map((child: VDOMNode | string): VDOMNode => {
        return typeof child === "string" ? text(child) : child;
      }),
    });
  };
}

export function createComponent<P extends Record<string, unknown>>(
  component: Class<Component<P, unknown>>,
  props: P
): VDOMComponent {
  return {
    type: VDOMType.COMPONENT,
    component,
    props,
  };
}
