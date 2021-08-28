declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.module.scss" {
  const styles: { [className: string]: string };
  export default styles;
}

declare type Class<T = any> = new (...args: any[]) => T;
